"use client"; // Marks this as a client-side React component (needed for interactivity in Next.js)

import { useState } from "react"; // React hook to manage component state
import { motion } from "framer-motion"; // Import Framer Motion for animations (not used directly here but available for use)

// Main component definition with prop 'onGenerate' (callback to send data to parent)
export default function TripForm({ onGenerate }: { onGenerate: (data: any) => void }) {

  // ------------------ STATE VARIABLES ------------------
  const [destination, setDestination] = useState(""); // Stores user-input destination (e.g., "Tokyo, Japan")
  const [days, setDays] = useState(5); // Number of travel days (default 5)
  const [budget, setBudget] = useState(1000); // Budget in pounds (default £1000)
  const [preferences, setPreferences] = useState("food, culture"); // User travel preferences
  const [date, setDate] = useState(""); // Travel start date
  const [loading, setLoading] = useState(false); // Indicates when API is processing

  // ------------------ SUBMIT HANDLER ------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Prevents default form submission behaviour
    setLoading(true); // Shows loading spinner

    try {
      // Sends form data to the API route '/api/generate'
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination, // Destination input
          days, // Number of days
          budget, // Total budget
          preferences: preferences.split(",").map((p) => p.trim()), // Converts comma-separated preferences into an array
          date, // Start date
        }),
      });

      // Parse the JSON response
      const json = await res.json();
      setLoading(false); // Stop loading spinner

      // If API responded successfully, send data to parent via onGenerate()
      if (json.ok) onGenerate(json.data);
      // Otherwise, show error message
      else alert("Error: " + json.error);
    } catch (err) {
      // Logs network or backend errors
      console.error(err);
      alert("Something went wrong. Check your API route or key.");
      setLoading(false);
    }
  }

  // ------------------ FORM UI ------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ---------- ROW 1: Destination + Days ---------- */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Destination input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Destination</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)} // Updates destination state
            placeholder="Tokyo, Japan"
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
            required
          />
        </div>

        {/* Number of days input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Days</label>
          <input
            type="number"
            min={1} // Minimum 1 day
            value={days}
            onChange={(e) => setDays(+e.target.value)} // Updates number of days
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
          />
        </div>
      </div>

      {/* ---------- ROW 2: Budget + Preferences ---------- */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Budget input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Budget (£)</label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(+e.target.value)} // Updates budget state
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
          />
        </div>

        {/* Preferences input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Preferences</label>
          <input
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)} // Updates preferences
            placeholder="food, nature, culture"
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
          />
        </div>
      </div>

      {/* ---------- ROW 3: Travel Date ---------- */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          Travel Start Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)} // Updates selected date
          required
          className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
        />
      </div>

      {/* ---------- SUBMIT BUTTON ---------- */}
      <button
        disabled={loading} // Disable when loading
        className={`w-full py-3 rounded-lg text-white font-medium transition-all duration-300 ${
          loading
            ? "bg-indigo-400 cursor-not-allowed" // Greyed out when loading
            : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg" // Active button styling
        }`}
      >
        {/* Button shows spinner while generating trip */}
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            {/* Spinner icon */}
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span>Generating...</span>
          </div>
        ) : (
          "Generate Trip" // Normal text when not loading
        )}
      </button>
    </form>
  );
}
