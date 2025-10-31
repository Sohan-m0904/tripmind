import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});




// 🔹 Helper function to fetch real coordinates
async function getCoordinates(place: string) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        place
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const json = await res.json();
    const loc = json.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { destination, days, budget, preferences, date } = await req.json();
    // 🌍 Try fetching real-time flight and hotel data from Amadeus




    const month = new Date(date).getMonth();
const monthName = new Date(date).toLocaleString("en-GB", { month: "long" });
const isHighSeason = [5, 6, 7, 11, 0].includes(month); // Jun–Aug, Dec–Jan
const seasonLabel = isHighSeason ? "high season" : "low season";
const adjustedBudget = isHighSeason ? budget * 1.15 : budget * 0.9;

// 🌦️ Describe general weather feel
const seasonWeather = isHighSeason
  ? "expect warm weather, vibrant crowds,higher prices and lively outdoor scenes"
  : "expect cooler temperatures, fewer tourists,lower prices and calm city vibes";

// 🧠 Add context to your AI prompt


    // 🔹 Build structured AI prompt
    const prompt = `
    You are TripMind, a precise yet creative travel-planning AI.
    
    Plan a ${days}-day trip to ${destination} under £${budget}.
    Focus on traveller preferences: ${preferences.join(", ")}.
    Whererver their recommended accomdation is, keep all activities and itinenary within that area


Adjust prices realistically — flights and hotels are ${isHighSeason ? "slightly higher" : "slightly cheaper"}.
Use a total adjusted budget of about £${Math.round(adjustedBudget)}.
Focus on traveller preferences: ${preferences.join(", ")}.

    
    ✍️ Write the "summary" field using these exact rules:
    1. Length: 6–8 complete sentences (roughly 100–140 words).
    2. Tone: warm, cinematic, and professional — like a National Geographic or Condé Nast feature.
    3. Structure:
       - 1st sentence: introduce destination and atmosphere (weather, energy, scenery)
       - 2nd–5th: describe highlights of food, culture, and pacing of the itinerary
       - 6th–7th: explain how the budget balances comfort and adventure
       - Final sentence: end with an emotional or inspiring thought
    4. Avoid lists, bullet points, repetition, or generic filler words.
    5. Keep spelling in British English.
    
    Respond ONLY with pure JSON (no markdown, no commentary).  
    The first character **must** be "{" and the last character **must** be "}".  
    Follow exactly this structure:
    
    {
      "summary": "Your refined 6–8 sentence paragraph here",
      "budget_breakdown": { "flights": number, "stay": number, "food": number, "activities": number, "misc": number },
      "accommodation": { "name": "string", "price_per_night": number, "description": "string", "lat": number, "lng": number },
      "itinerary": [
        { "day": 1, "summary": "Short overview", "details": [
            { "time": "Morning", "activity": "Detailed description, preferrably 3-4 setences" },
            { "time": "Afternoon", "activity": "Detailed description, preferrably 3-4 setences" },
            { "time": "Evening", "activity": "Detailed description, preferrably 3-4 setences" }
          ], "estimated_cost": number }
      ]
    }
    `;
    
    

    

    // 🔹 Ask Groq model for itinerary
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    let message = completion.choices[0].message?.content?.trim() || "{}";

    // ✅ try to parse first
    try {
      JSON.parse(message);
    } catch {
      // if Groq wrapped extra text around the JSON, isolate just the object
      const start = message.indexOf("{");
      const end = message.lastIndexOf("}") + 1;
      message = message.slice(start, end);
    }
    
    
    // 🔹 Parse JSON safely
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.warn("AI response not valid JSON");
      data = { summary: message, budget_breakdown: {}, itinerary: [] };
    }

    // 🔹 Enrich itinerary with real coordinates
// 🔹 Enrich itinerary + accommodation with coordinates
if (data.accommodation?.name) {
  const coords = await getCoordinates(`${data.accommodation.name}, ${destination}`);
  if (coords) {
    data.accommodation.lat = coords.lat;
    data.accommodation.lng = coords.lng;
  }
}

if (Array.isArray(data.itinerary)) {
  for (const day of data.itinerary) {
    const coords = await getCoordinates(`${day.summary}, ${destination}`);
    if (coords) {
      day.lat = coords.lat;
      day.lng = coords.lng;
    }
  }
}
// 🔹 Fetch a real, high-quality image from Unsplash
try {
  // Determine season based on travel date
  const month = new Date(date).getMonth();
  const season =
    month < 2
      ? "winter"
      : month < 5
      ? "spring"
      : month < 8
      ? "summer"
      : "autumn";

  // Build smarter query (season + preferences + destination)
  const searchQuery = `${destination} ${season} travel landscape ${preferences.join(", ")}`;
  const randomPage = Math.floor(Math.random() * 5) + 1; // pick between 1–5 pages

  // Fetch up to 10 varied landscape images
  const imageRes = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      searchQuery
    )}&orientation=landscape&per_page=10&page=${randomPage}&client_id=${
      process.env.UNSPLASH_ACCESS_KEY
    }`
  );

  const imageJson = await imageRes.json();

  // Randomly select one of the results
  const randomIndex = Math.floor(Math.random() * imageJson.results?.length || 0);
  const chosenImage = imageJson.results?.[randomIndex];

  // ✅ Ensure at least 1080p (prefer full > regular)
  if (chosenImage?.urls?.full) {
    data.image = `${chosenImage.urls.full}&w=1920&q=85`;
  } else if (chosenImage?.urls?.regular) {
    data.image = `${chosenImage.urls.regular}&w=1920&q=85`;
  } else {
    data.image = null;
  }

  console.log("📸 Unsplash image result:", data.image);
} catch (err) {
  console.warn("⚠️ Unsplash image fetch failed:", err);
  data.image = null;
}




// ✅ Attach live data BEFORE returning


// ✅ Return success response
return NextResponse.json({ ok: true, data });


  } catch (error: any) {
    console.error("Groq error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate trip" },
      { status: 500 }
    );
  }
}
