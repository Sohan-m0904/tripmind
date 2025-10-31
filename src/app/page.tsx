"use client";
/*
Marks this file as a client component in Next.js. This ensures the component runs on the client side,
since it relies on interactivity (form inputs, state updates, and animations) that can only happen
in the browser environment rather than on the server.
*/

import { useState } from "react"; // React hook to manage component state.
import TripForm from "@/components/TripForm"; // Component that collects user trip input data.
import TripSummary from "@/components/TripSummary"; // Component that displays the generated trip plan.
import TripChat from "@/components/TripChat"; // Component that allows users to refine their trip interactively.
import { motion } from "framer-motion"; // Library for smooth animations and transitions.


/*
Main Component: HomePage
------------------------
This component acts as the entry point of the TripMind application. It connects together the form input,
AI-generated trip summary, and refinement chat into one cohesive user flow. 

Core responsibilities:
1. Display an animated header introducing the app.
2. Render a trip form for users to describe their desired trip.
3. Once the trip data is generated, show the trip summary and chat sections.
4. Manage application-level state (tripData) to handle trip generation and refinement updates.
*/
export default function HomePage() {
  // Stores the trip data returned from the AI API or user refinements.
  const [tripData, setTripData] = useState<any | null>(null);

  /*
  Return Section (UI Rendering)
  -----------------------------
  The JSX below renders the full page layout using TailwindCSS and Framer Motion animations.

  Layout Overview:
  - A full-screen gradient background with padding.
  - A centered container (`max-w-4xl`) for all inner content.
  - An animated header introducing TripMind.
  - A section for the trip form to collect user input.
  - Conditional rendering of trip summary and chat once a trip has been generated.
  */
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Main container to center content and limit width */}
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ---------------------------------------------------
            🧭 Header Section
            Displays the TripMind logo, tagline, and a smooth entrance animation.
            Framer Motion animates the header fading in from the top for a polished look.
        --------------------------------------------------- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }} // Start faded and slightly above
          animate={{ opacity: 1, y: 0 }}   // Animate into view
          transition={{ duration: 0.7 }}   // Smooth 0.7s fade duration
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
            TripMind ✈️
          </h1>
          <p className="text-gray-600">
            Your intelligent travel companion — plan perfect trips in seconds.
          </p>
        </motion.header>

        {/* ---------------------------------------------------
            🧾 Trip Form Section
            This section displays the TripForm component, which collects user input 
            such as destination, days, budget, preferences, and travel dates.
            When the form is submitted, TripForm calls `onGenerate` and updates the tripData state.
        --------------------------------------------------- */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
          {/* Pass setTripData as callback so TripForm can update main state */}
          <TripForm onGenerate={setTripData} />
        </section>

        {/* ---------------------------------------------------
            🧠 Conditional Rendering: Trip Summary + Chat
            Once `tripData` exists (i.e., the AI has generated a plan),
            two new animated sections are shown:
            1. TripSummary — displays the AI-generated itinerary visually.
            2. TripChat — lets users refine the trip interactively by sending feedback.
        --------------------------------------------------- */}
        {tripData && (
          <>
            {/* Trip Summary Section */}
            <motion.section
              key="trip-summary"
              initial={{ opacity: 0, y: 20 }}  // Fade in and slide upward
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Pass the generated trip data into TripSummary */}
              <TripSummary data={tripData} />
            </motion.section>

            {/* ---------------------------------------------------
                💬 Trip Chat Section
                The TripChat component provides an interactive refinement area where users can
                type feedback like “Add more beaches” or “Reduce the budget.”
                When the chat sends new feedback, it calls the API to regenerate the trip,
                and the parent updates `tripData` accordingly.
            --------------------------------------------------- */}
            <motion.section
              key="trip-chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <TripChat
                currentTrip={tripData} // Sends current trip data for refinement
                onRefined={(newTrip: any) => setTripData(newTrip)} // Updates the UI with the refined trip
              />
            </motion.section>
          </>
        )}
      </div>
    </main>
  );
}
