"use client"; // This component runs on the client side (needed for interactivity in Next.js)

import { useState } from "react"; // React hook for managing component state

// Main TripChat component
export default function TripChat({ currentTrip, onRefined }: any) {
  // message → stores user’s input text (feedback for refinement)
  const [message, setMessage] = useState("");
  // loading → used to show “Refining...” state and disable inputs while waiting for response
  const [loading, setLoading] = useState(false);

  // Function triggered when user clicks the "Send" button
  async function handleRefine() {
    // Prevent sending empty messages
    if (!message.trim()) return;
    setLoading(true); // Start loading state

    try {
      // Send refinement request to the backend API route `/api/refine`
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTrip: currentTrip,  // Send current trip data to backend
          feedback: message,         // Include the user’s refinement request
        }),
      });

      // Wait for the backend to respond and parse JSON
      const data = await res.json();

      // If backend responds successfully and returns updated data
      if (data.ok && data.data) {
        onRefined(data.data); // Update the parent component with refined trip data
      } else {
        // If backend indicates an error, log and alert
        console.error("Refine failed:", data.error);
        alert("Something went wrong refining your trip.");
      }
    } catch (err) {
      // Catch and log any network or API errors
      console.error("Refine error:", err);
      alert("Network or API error — check console for details.");
    }

    // Reset loading state and clear message box
    setLoading(false);
    setMessage("");
  }

  // Component UI
  return (
    <div className="mt-8 bg-white rounded-2xl p-4 shadow border border-gray-100">
      {/* Title section */}
      <h3 className="font-semibold text-gray-800 mb-2">💬 Refine Your Trip</h3>

      {/* Input and button area */}
      <div className="flex gap-2">
        {/* Text input for user feedback */}
        <input
          type="text"
          className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
          placeholder="e.g. Add a beach day or reduce budget"
          value={message}
          onChange={(e) => setMessage(e.target.value)} // Updates message state as user types
          disabled={loading} // Disables input while refining
        />

        {/* Button to trigger refinement */}
        <button
          onClick={handleRefine}
          disabled={loading} // Prevents clicking multiple times
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {/* Button text changes while loading */}
          {loading ? "Refining..." : "Send"}
        </button>
      </div>
    </div>
  );
}
