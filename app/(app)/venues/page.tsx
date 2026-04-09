"use client";

import { useEffect, useState } from "react";
import VenueSelect from "@/app/components/ui/VenueSelect";
import CustomCard from "@/app/components/ui/CustomCard";
import { apiFetch } from "@/app/lib/apiFetch";
import { Spinner } from "@radix-ui/themes";

type Venue = {
  name: string;
  capacity: number;
};

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [displayedVenues, setDisplayedVenues] = useState<Venue[]>([]);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await apiFetch("/api/venues");

        if (!res.ok) {
          setError("Failed to fetch venues");
          return;
        }

        const data = await res.json();
        setVenues(data);
        setDisplayedVenues(data); // show all the venues first
      } catch (err) {
        console.error("Error fetching venues:", err);
        setError("Error fetching venues");
      } finally {
        setDataIsLoaded(true);
      }
    };
    fetchVenues();
  }, []);

  const handleVenueChange = async (venueName: string | null) => {
    if (!venueName) {
      setDisplayedVenues(venues);
      return;
    }

    try {
      const res = await apiFetch(`/api/venues/${venueName}`);

      if (!res.ok) {
        setError("Failed to fetch venue details");
        return;
      }

      const venueDetails = await res.json();
      setDisplayedVenues([venueDetails]);
      setError("");
    } catch (err) {
      console.error("Error handling venue change:", err);
      setError("Error handling venue change");
    }
  };

  if (!dataIsLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-700">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold text-gray-800">Venues </h1>

      <div className="mb-4">
        <VenueSelect data={venues} onChange={handleVenueChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedVenues.map((venue: Venue) => (
          <CustomCard key={venue.name}>
            <h2 className="text-lg font-semibold">{venue.name}</h2>
            <p className="text-sm text-gray-600">Capacity: {venue.capacity}</p>
          </CustomCard>
        ))}

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
