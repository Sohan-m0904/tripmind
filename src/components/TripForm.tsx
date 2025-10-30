"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function TripForm({ onGenerate }: { onGenerate: (data: any) => void }) {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(1000);
  const [preferences, setPreferences] = useState("food, culture");
  const [date, setDate] = useState(""); 
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          budget,
          preferences: preferences.split(",").map((p) => p.trim()),
          date,
        }),
      });
      const json = await res.json();
      setLoading(false);
      if (json.ok) onGenerate(json.data);
      else alert("Error: " + json.error);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check your API route or key.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Destination</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Tokyo, Japan"
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Days</label>
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(+e.target.value)}
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Budget (£)</label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(+e.target.value)}
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Preferences</label>
          <input
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="food, nature, culture"
            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
          />
        </div>
      </div>

      <div>
  <label className="block text-sm font-semibold text-gray-700">
    Travel Start Date
  </label>
  <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    required
    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2 shadow-sm"
  />
</div>




      <button
  disabled={loading}
  className={`w-full py-3 rounded-lg text-white font-medium transition-all duration-300 ${
    loading
      ? "bg-indigo-400 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
  }`}
>
  {loading ? (
    <div className="flex items-center justify-center space-x-2">
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
    "Generate Trip"
  )}
</button>

    </form>
  );
}
