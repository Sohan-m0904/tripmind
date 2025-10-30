"use client";
import { useState } from "react";

export default function TripChat({ currentTrip, onRefined }: any) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRefine() {
    if (!message) return;
    setLoading(true);

    const res = await fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: message, currentTrip }),
    });
    const data = await res.json();
    onRefined(data);
    setLoading(false);
    setMessage("");
  }

  return (
    <div className="mt-8 bg-white rounded-2xl p-4 shadow border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-2">💬 Refine Your Trip</h3>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
          placeholder="e.g. Add more food activities or reduce budget"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={handleRefine}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Refining..." : "Send"}
        </button>
      </div>
    </div>
  );
}
