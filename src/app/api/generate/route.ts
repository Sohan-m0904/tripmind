/*
📘 Purpose of This File
-----------------------
This file defines the `/api/generate` endpoint of the TripMind application.
It handles POST requests to create a new AI-generated travel itinerary.

Main Responsibilities:
1. Receive trip input from the frontend (destination, budget, days, etc.).
2. Optionally fetch extra data like coordinates from Google Maps.
3. Build a detailed context prompt for the Groq AI model.
4. Request a structured itinerary and summary from Groq’s LLaMA 3.1 model.
5. Return the AI-generated trip data in JSON format back to the frontend.
*/

import { NextRequest, NextResponse } from "next/server"; // Next.js types for API routes
import Groq from "groq-sdk"; // Groq SDK to access the Groq AI models


/*
🧠 Step 1: Initialise Groq Client
---------------------------------
Creates a Groq instance with the API key stored securely in environment variables.
This ensures the backend can access Groq’s AI services safely.
*/
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!, // The '!' tells TypeScript the variable definitely exists.
});


/*
🌍 Step 2: Helper Function – getCoordinates()
--------------------------------------------
This asynchronous helper fetches the geographic coordinates (latitude and longitude)
for a given place name using the Google Maps Geocoding API.

Usage:
- Helps enrich the AI output with real-world coordinates.
- Enables map visualisation on the frontend.

If successful, returns:
  { lat: number, lng: number }

If unsuccessful (invalid place or network error), returns:
  null
*/
async function getCoordinates(place: string) {
  try {
    // Construct and send a request to Google Maps API for geocoding
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        place
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    // Parse the response into JSON format
    const json = await res.json();

    // Extract location coordinates (if available)
    const loc = json.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;

  } catch (err) {
    // Handle errors gracefully (e.g., invalid response, rate limits)
    console.error("Geocoding error:", err);
    return null;
  }
}


/*
🚀 Step 3: POST Request Handler
-------------------------------
This is the main function that executes whenever a POST request is made
to `/api/generate`.

It does the following:
1. Reads and validates user input from the frontend.
2. Calculates seasonal context based on the selected travel date.
3. (Later) Builds a natural-language prompt for Groq’s LLaMA model.
4. (Later) Sends the prompt to the AI model for structured itinerary generation.
*/
export async function POST(req: NextRequest) {
  try {
    // Step 3.1: Extract data from the request body
    // The frontend sends the trip parameters as JSON.
    const { destination, days, budget, preferences, date } = await req.json();

    // 🧭 (Optional Future Feature)
    // Attempt to fetch real-time flight and hotel data (e.g., via Amadeus API).
    // Currently commented/documented for future integration.

    // 🌤 Step 3.2: Determine Travel Season Context
    // The logic below determines which season the trip falls in, adjusts the budget,
    // and adds descriptive seasonal notes that make the AI-generated itinerary more realistic.

    // Extract numerical month from selected travel date
    const month = new Date(date).getMonth();

    // Convert month into readable English month name (e.g. "January", "June")
    const monthName = new Date(date).toLocaleString("en-GB", { month: "long" });

    // Identify if the selected month is considered "high season"
    // High season typically has warmer weather, more crowds, and higher prices.
    const isHighSeason = [5, 6, 7, 11, 0].includes(month); // June–August, December–January

    // Assign a label for readability (used in AI prompt)
    const seasonLabel = isHighSeason ? "high season" : "low season";

    // Slightly adjust budget expectations for realism (higher for peak months)
    const adjustedBudget = isHighSeason ? budget * 1.15 : budget * 0.9;

    // 🌦️ Step 3.3: Add General Weather Context
    // These strings provide contextual details for the AI so it can generate
    // seasonally accurate trip descriptions (e.g., beach days vs. museum visits).
    const seasonWeather = isHighSeason
      ? "expect warm weather, vibrant crowds, higher prices, and lively outdoor scenes"
      : "expect cooler temperatures, fewer tourists, lower prices, and calm city vibes";

    // 🧠 Step 3.4: Add Context to AI Prompt
    // This variable will soon be used to assemble a detailed natural language prompt
    // that includes the season, adjusted budget, preferences, and user inputs.
    // The AI will use this context to generate a realistic, structured itinerary
    // including day-by-day activities, budget breakdown, accommodation, and summary.

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
    
    

    
    /*
    🔹 Step 4: Request Itinerary from Groq Model
    --------------------------------------------
    Once the AI prompt is assembled (in previous lines), we send it to Groq’s
    LLaMA 3.1 model using the Groq SDK.

    What happens here:
    - The `chat.completions.create()` method submits our custom prompt.
    - The model replies with structured text (ideally a valid JSON itinerary).
    - The result contains an array of `choices`, and we extract the first message.

    The model chosen — `llama-3.1-8b-instant` — is a compact but powerful variant 
    optimised for reasoning and fast responses.
    */
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract the model’s textual response and trim whitespace
    let message = completion.choices[0].message?.content?.trim() || "{}";

    /*
    ✅ Step 5: Attempt to Parse JSON Directly
    -----------------------------------------
    The AI response should be pure JSON. However, LLMs occasionally add
    extra commentary or text before/after the JSON block.
    - First, we attempt to parse the entire response.
    - If that fails, we locate the first '{' and last '}' to extract the valid JSON part.
    */
    try {
      JSON.parse(message);
    } catch {
      const start = message.indexOf("{");
      const end = message.lastIndexOf("}") + 1;
      message = message.slice(start, end);
    }
    
    /*
    🔹 Step 6: Safely Parse JSON and Handle Fallbacks
    -------------------------------------------------
    Now we parse the cleaned text into a JavaScript object.
    If parsing still fails (invalid format or incomplete JSON),
    we log a warning and create a fallback object with minimal data.
    */
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.warn("AI response not valid JSON");
      data = { summary: message, budget_breakdown: {}, itinerary: [] };
    }

    /*
    🌍 Step 7: Enrich Itinerary and Accommodation with Real Coordinates
    -------------------------------------------------------------------
    The AI model provides text-only location data (e.g., “Eiffel Tower”).
    To enable map visualisation in the frontend, this section uses our earlier
    `getCoordinates()` helper to fetch real latitude/longitude values 
    for both accommodation and each itinerary item.

    - For accommodation: adds `lat` and `lng` fields directly to the object.
    - For each day: fetches coordinates for the daily summary (key destination/activity).
    */
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

    /*
    📸 Step 8: Fetch High-Quality Destination Image from Unsplash
    -------------------------------------------------------------
    This section enriches the itinerary visually by fetching a beautiful, 
    seasonally relevant travel image from the Unsplash API.

    Process:
    - Determine the current travel season (winter, spring, summer, autumn).
    - Build a search query combining the destination, season, and preferences.
    - Randomly pick an image from one of several result pages to add variety.
    - Ensure the selected image has a high resolution (prefer 'full' or 'regular' URL).
    - Attach the chosen image URL to `data.image`.

    If Unsplash fails to return results, the image is set to `null`.
    */
    try {
      const month = new Date(date).getMonth();
      const season =
        month < 2
          ? "winter"
          : month < 5
          ? "spring"
          : month < 8
          ? "summer"
          : "autumn";

      const searchQuery = `${destination} ${season} travel landscape ${preferences.join(", ")}`;
      const randomPage = Math.floor(Math.random() * 5) + 1;

      const imageRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchQuery
        )}&orientation=landscape&per_page=10&page=${randomPage}&client_id=${
          process.env.UNSPLASH_ACCESS_KEY
        }`
      );

      const imageJson = await imageRes.json();

      const randomIndex = Math.floor(Math.random() * imageJson.results?.length || 0);
      const chosenImage = imageJson.results?.[randomIndex];

      // ✅ Ensure at least 1080p resolution, prefer full-sized image
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

    /*
    ✅ Step 9: Finalise and Return Response
    --------------------------------------
    At this point, the generated trip has:
    - A complete itinerary (from Groq)
    - Accurate coordinates (from Google Maps)
    - A high-quality background image (from Unsplash)

    The final enriched data is now sent back to the frontend as a JSON response.
    */
    return NextResponse.json({ ok: true, data });

  } catch (error: any) {
    /*
    ⚠️ Step 10: Error Handling
    --------------------------
    If the Groq API call fails, the network breaks, or an unexpected exception occurs,
    this section ensures the backend responds safely with a 500 status code
    and a clear error message.
    */
    console.error("Groq error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate trip" },
      { status: 500 }
    );
  }
}
