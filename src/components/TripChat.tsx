"use client";
import { useState } from "react";

export default function TripChat({ currentTrip, onRefined }: any) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRefine() {
    if (!message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTrip: currentTrip,  // ✅ fixed variable name
          feedback: message,         // ✅ use the user’s input message
        }),
      });

      const data = await res.json();

      if (data.ok && data.data) {
        onRefined(data.data); // ✅ update trip data in parent
      } else {
        console.error("Refine failed:", data.error);
        alert("Something went wrong refining your trip.");
      }
    } catch (err) {
      console.error("Refine error:", err);
      alert("Network or API error — check console for details.");
    }

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
          placeholder="e.g. Add a beach day or reduce budget"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
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
