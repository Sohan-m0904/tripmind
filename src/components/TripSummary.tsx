"use client";
import { motion } from "framer-motion";
import TripMap from "./TripMap";
import BudgetChart from "./BudgetChart";
import jsPDF from "jspdf";




export default function TripSummary({ data }: { data: any | null }) {
  if (!data) return null;

  // 🧠 Safely handle and parse data
  let parsedData = data;

  try {
    if (typeof data === "string") {
      const cleaned = data
        .replace(/^Summary\s*/i, "")                // remove leading "Summary"
        .replace(/```json|```/gi, "")               // strip markdown fences
        .replace(/^[^{]*({[\s\S]*})[^}]*$/m, "$1") // keep only the JSON object
        .replace(/,\s*([\]}])/g, "$1")              // remove trailing commas
        .trim();
  
      parsedData = JSON.parse(cleaned);
    }
  } catch (err) {
    console.warn("❌ Could not parse AI JSON:", err, data);
    parsedData = { summary: "Error parsing response", budget_breakdown: {}, itinerary: [] };
  }
  
  
  

   // ✅ Step 2: Handle cases where API returns { ok: true, data: {...} }
   if (parsedData && parsedData.data && parsedData.data.summary) {
    parsedData = parsedData.data;
  }

  // ✅ Step 3: Guarantee all essential keys exist
  parsedData = {
    summary: parsedData.summary || "No summary available",
    budget_breakdown: parsedData.budget_breakdown || {},
    accommodation: parsedData.accommodation || {},
    itinerary: parsedData.itinerary || [],
    image: parsedData.image || null
  };

  // ✅ Step 4: Destructure AFTER unwrapping and ensuring defaults
  const { summary, budget_breakdown, accommodation, itinerary } = parsedData;

  // ✅ Step 5: Make sure summary is always a readable string
  const readableSummary =
    typeof summary === "string"
      ? summary
      : JSON.stringify(summary, null, 2);

// 🔗 Auto-link place names to Google Search
function linkifyPlaces(text: string, destination?: string) {
  if (!text) return "";

  // Require 2–5 capitalised words (reduces false links like "Visit")
  // Unicode-aware (handles accents, ’, -) and uses the "u" flag.
  const placeRegex = /\b([A-Z][\p{L}\p{M}’'-]+(?:\s+[A-Z][\p{L}\p{M}’'-]+){1,4})\b/gu;

  // Figure out where the first "word" ends (after any leading spaces/emojis)
  const m = /^\s*\S+/.exec(text);
  const firstWordEnd = m ? m[0].length : 0;

  return text.replace(placeRegex, (match, _grp, offset) => {
    // If the match begins inside the first word span, skip it
    if (offset < firstWordEnd) return match;

    const q = encodeURIComponent(`${match} ${destination ?? ""}`.trim());
    return `<a href="https://www.google.com/search?q=${q}" target="_blank" class="text-indigo-600 hover:underline">${match}</a>`;
  });
}

// 📄 Export itinerary as PDF
const handleExportPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");
  const margin = 15;
  let y = margin;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TripMind Itinerary", margin, y);
  y += 10;

  // Destination
  if (parsedData.destination) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Destination: ${parsedData.destination}`, margin, y);
    y += 10;
  }

  // Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Summary", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const splitSummary = doc.splitTextToSize(parsedData.summary, 180);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 6 + 6;

  // Budget Breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Budget Breakdown", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  for (const [key, value] of Object.entries(parsedData.budget_breakdown)) {
    doc.text(`${key}: £${value}`, margin, y);
    y += 6;
  }
  y += 8;

  // Accommodation
  if (parsedData.accommodation?.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Recommended Accommodation", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(parsedData.accommodation.name, margin, y);
    y += 6;
    doc.text(`£${parsedData.accommodation.price_per_night} per night`, margin, y);
    y += 6;
    const accSplit = doc.splitTextToSize(parsedData.accommodation.description, 180);
    doc.text(accSplit, margin, y);
    y += accSplit.length * 6 + 8;
  }

  // Itinerary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Itinerary", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  parsedData.itinerary.forEach((day: any) => {
    const dayHeader = `Day ${day.day}: ${day.summary}`;
    const splitDay = doc.splitTextToSize(dayHeader, 180);

    // Add new page if near bottom
    if (y + splitDay.length * 6 > 270) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.text(splitDay, margin, y);
    y += splitDay.length * 6 + 4;

    day.details?.forEach((detail: any) => {
      const detailText = `${detail.time}: ${detail.activity}`;
      const splitDetail = doc.splitTextToSize(detailText, 180);

      if (y + splitDetail.length * 6 > 280) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "normal");
      doc.text(splitDetail, margin + 5, y);
      y += splitDetail.length * 6 + 2;
    });

    doc.text(`Est. £${day.estimated_cost}`, margin + 5, y);
    y += 10;
  });

  // Save
  doc.save(`${parsedData.destination || "TripMind"}_Itinerary.pdf`);
};








  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-6"
    >
     {parsedData.image && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
    className="overflow-hidden rounded-2xl shadow-md"
  >
    <img
      src={parsedData.image}
      alt={`Photo of ${parsedData.destination || "trip destination"}`}
        className="w-full h-[420px] sm:h-[480px] md:h-[540px] lg:h-[600px] object-cover rounded-2xl"
    />
  </motion.div>
)}

<motion.div className="space-y-6">

<div className="flex justify-end mb-4">
  <button
    onClick={handleExportPDF}
    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
  >
    📄 Export as PDF
  </button>
</div>

<div id="trip-summary-section">
      {/* Summary Card */}
      <div className="p-6 bg-gradient-to-b from-indigo-50 to-white rounded-2xl shadow-md border border-indigo-100">

        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Summary</h2>
        <p className="text-gray-700 leading-relaxed text-[15px] sm:text-base whitespace-pre-line">
        {readableSummary || "No summary available"}
      </p>


      </div>



            {/* Budget Breakdown Section */}
      {budget_breakdown && Object.keys(budget_breakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-6 bg-white rounded-2xl shadow-md border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            💰 Budget Breakdown
          </h3>

          {/* Grid of numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm mb-4">
            {Object.entries(budget_breakdown).map(([key, value]) => (
              <div
                key={key}
                className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-center"
              >
                <p className="capitalize font-medium text-gray-700">{key}</p>
                <p className="text-indigo-700 font-semibold">£{value as number}</p>
              </div>
            ))}
          </div>

          {/* Pie chart */}
          <div className="flex justify-center items-center">
            <BudgetChart breakdown={budget_breakdown} />
          </div>
        </motion.div>
      )}



      {/* Accommodation Card */}
      {parsedData.accommodation && (
        <a
        href={`https://www.google.com/search?q=${encodeURIComponent(`${accommodation.name} ${parsedData.destination || ""}`)}`}


        target="_blank"
        rel="noopener noreferrer"
      >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-6 bg-white rounded-2xl shadow-md border border-gray-100 space-y-2"
          >
            <h3 className="text-lg font-semibold text-gray-800">🏨 Recommended Accommodation</h3>
            <p className="text-gray-700 font-medium">{parsedData.accommodation.name}</p>
            <p className="text-gray-600 text-sm">
              £{parsedData.accommodation.price_per_night} per night
            </p>
            <p className="text-gray-500 text-sm">
              {parsedData.accommodation.description}
            </p>


        </motion.div>
        </a>
      )}


      {/* Map Section (Animated Card) */}
      {itinerary && itinerary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="p-6 bg-white rounded-2xl shadow-md border border-gray-100 space-y-3"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🗺️ Map View
            <span className="text-sm font-normal text-gray-500">
              Visual route of your trip
            </span>
          </h3>

          <TripMap
            locations={itinerary
              .filter((i: any) => i.lat && i.lng)
              .map((i: any) => ({
                lat: i.lat,
                lng: i.lng,
                name: i.summary,
              }))}
          />
        </motion.div>
      )}



            {/* Itinerary */}
      {/* Itinerary Section */}
      {Array.isArray(itinerary) && itinerary.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">📅 Itinerary</h3>

          {itinerary.map((item: any) => (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item.day * 0.1, duration: 0.4 }}
              className="p-6 bg-white rounded-2xl shadow border border-gray-100"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-indigo-700 font-semibold text-lg">
                  Day {item.day} • {item.summary}
                </h4>
                <span className="text-sm text-gray-500">
                  Est. £{item.estimated_cost}
                </span>
              </div>

              {/* Daily Activities */}
              <div className="space-y-3">
                {item.details?.map((d: any, i: number) => {
                  const icon =
                    d.time.toLowerCase().includes("morning") ? "☀️" :
                    d.time.toLowerCase().includes("afternoon") ? "🌇" :
                    d.time.toLowerCase().includes("evening") ? "🌙" :
                    "🕐";





                  return (
                    <div
                      key={i}
                      className="flex items-start space-x-3 bg-indigo-50/60 rounded-xl p-3 border border-indigo-100"
                    >
                      <div className="text-xl">{icon}</div>
                      <div>
                        <p className="font-medium text-gray-800">{d.time}</p>
                        <p
                          className="text-gray-600 text-sm leading-snug"
                          dangerouslySetInnerHTML={{ __html: linkifyPlaces(d.activity, parsedData.destination) }}
                        />

                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
</div>
          </motion.div>
          
          </motion.div>        
  );
}
