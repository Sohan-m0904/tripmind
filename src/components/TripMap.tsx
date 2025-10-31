"use client";
import { useEffect, useRef } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

type Location = {
  lat: number;
  lng: number;
  name?: string;
};

export default function TripMap({ locations }: { locations: Location[] }) {
  const { isLoaded } = useJsApiLoader({
    id: "tripmind-map",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // compute map centre dynamically
  const center = locations.length
    ? { lat: locations[0].lat, lng: locations[0].lng }
    : { lat: 20.5937, lng: 78.9629 }; // India fallback

  // When locations change → recenter map
  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach((loc) => bounds.extend(loc));
      mapRef.current.fitBounds(bounds);
    }
  }, [locations]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-[400px]">
      {isLoaded ? (
        <GoogleMap
          onLoad={(map) => {
  mapRef.current = map;
}}

          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={6}
        >
          {locations.map((loc, i) => (
            <Marker
              key={i}
              position={loc}
              label={`${i + 1}`}
              title={loc.name || `Day ${i + 1}`}
            />
          ))}

          {/* optional connecting route */}
          {locations.length > 1 && (
            <Polyline
              path={locations}
              options={{
                strokeColor: "#4f46e5",
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading map...
        </div>
      )}
    </div>
  );
}
