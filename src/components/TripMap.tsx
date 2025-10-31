"use client"; 
// This directive ensures the component runs on the client side in Next.js.
// It’s required because this file uses browser APIs (Google Maps) which only exist in the client environment.

import { useEffect, useRef } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
// The above imports bring in React hooks and Google Maps React components used to render the interactive map.

// ----------------------------
// 🧩 Type Definition Section
// This section defines the `Location` type — a reusable structure describing each point on the map.
// Each location includes latitude and longitude (required) and an optional `name` for labeling markers.
// ----------------------------
type Location = {
  lat: number;
  lng: number;
  name?: string;
};

// ----------------------------
// 🗺️ Main Component Declaration
// The TripMap component visualises the trip route using Google Maps.
// It receives an array of `locations` as props, where each entry represents a place in the user’s itinerary.
// The map dynamically loads using Google Maps API and adjusts its zoom and bounds based on these locations.
// ----------------------------
export default function TripMap({ locations }: { locations: Location[] }) {

  // ----------------------------
  // ⚙️ Google Maps API Loader
  // The `useJsApiLoader` hook asynchronously loads the Google Maps JavaScript API.
  // It returns an `isLoaded` flag, which ensures the map renders only after the API is ready.
  // The API key is securely accessed from environment variables.
  // ----------------------------
  const { isLoaded } = useJsApiLoader({
    id: "tripmind-map", // A unique ID for this instance of the map
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, // Google Maps API key
  });

  // ----------------------------
  // 🧭 Map Reference Setup
  // The `useRef` hook stores a reference to the map instance so we can directly manipulate it.
  // For example, we’ll use this reference to auto-fit the map view when locations change.
  // ----------------------------
  const mapRef = useRef<google.maps.Map | null>(null);

  // ----------------------------
  // 📍 Map Center Calculation
  // This section sets the initial center position for the map.
  // If there are trip locations available, the map starts centered on the first location.
  // Otherwise, it defaults to India (as a safe fallback center point).
  // ----------------------------
  const center = locations.length
    ? { lat: locations[0].lat, lng: locations[0].lng } // Center on first trip location
    : { lat: 20.5937, lng: 78.9629 }; // Default fallback (India)

  // ----------------------------
  // 🧮 Auto-Fit Map Bounds
  // This useEffect runs whenever the `locations` array changes.
  // It dynamically adjusts the map view so all markers are visible.
  // It calculates map bounds using each location’s coordinates and then fits the map accordingly.
  // ----------------------------
  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds(); // Create a new bounding box
      locations.forEach((loc) => bounds.extend(loc)); // Expand bounds for each location
      mapRef.current.fitBounds(bounds); // Adjust map to include all markers
    }
  }, [locations]);

  // ----------------------------
  // 🖼️ Rendering the Map
  // The map is wrapped inside a styled div for layout and design consistency.
  // If `isLoaded` is true, it renders the live interactive map.
  // Otherwise, it shows a loading message until Google Maps is ready.
  // ----------------------------
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-[400px]">
      {isLoaded ? (
        // ----------------------------
        // 🗺️ GoogleMap Component
        // This component displays the map itself.
        // The `onLoad` event stores the map reference in `mapRef` for later manipulations.
        // The `center` and `zoom` determine initial view, but bounds auto-adjust afterwards.
        // ----------------------------
        <GoogleMap
          onLoad={(map) => {
            mapRef.current = map; // Save map reference
          }}
          mapContainerStyle={{ width: "100%", height: "100%" }} // Makes map fill the container
          center={center} // Initial center point
          zoom={6} // Default zoom before bounds adjustment
        >
          {/* ----------------------------
              📍 Marker Rendering
              Each location in the array is rendered as a numbered marker on the map.
              The label shows its sequence (e.g., Day 1, Day 2), and title shows the name or day number.
          ---------------------------- */}
          {locations.map((loc, i) => (
            <Marker
              key={i}
              position={loc} // Latitude and longitude
              label={`${i + 1}`} // Numbered marker
              title={loc.name || `Day ${i + 1}`} // Tooltip title
            />
          ))}

          {/* ----------------------------
              🔗 Polyline (Connecting Route)
              If there’s more than one location, a polyline connects them in order.
              The path visually represents the user’s travel route across all destinations.
          ---------------------------- */}
          {locations.length > 1 && (
            <Polyline
              path={locations} // Connect points in given order
              options={{
                strokeColor: "#4f46e5", // Indigo line
                strokeOpacity: 0.8, // Slight transparency
                strokeWeight: 3, // Line thickness
              }}
            />
          )}
        </GoogleMap>
      ) : (
        // ----------------------------
        // ⏳ Loading State
        // Displayed while Google Maps API is loading.
        // This ensures no errors occur before the map is ready.
        // ----------------------------
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading map...
        </div>
      )}
    </div>
  );
}
