"use client";
import { useState } from "react";
import TripForm from "@/components/TripForm";
import TripSummary from "@/components/TripSummary";
import TripChat from "@/components/TripChat";
import { motion } from "framer-motion";

export default function HomePage() {
  const [tripData, setTripData] = useState<any | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
            TripMind ✈️
          </h1>
          <p className="text-gray-600">
            Your intelligent travel companion — plan perfect trips in seconds.
          </p>
        </motion.header>

        {/* Form */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
          <TripForm onGenerate={setTripData} />
        </section>

        {/* Only show summary + chat once tripData exists */}
        {tripData && (
          <>
            <motion.section
              key="trip-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <TripSummary data={tripData} />
            </motion.section>

            <motion.section
              key="trip-chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <TripChat
                currentTrip={tripData}
                onRefined={(newTrip: any) => setTripData(newTrip)}

              />
            </motion.section>
          </>
        )}
      </div>
    </main>
  );
}
