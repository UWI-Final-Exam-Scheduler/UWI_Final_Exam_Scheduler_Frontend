import { apiFetch } from "./apiFetch";

export async function venueFetch() {
  const response = await apiFetch("/api/venues");
  if (!response.ok) {
    throw new Error("Failed to fetch venues");
  }
  return response.json();
}

export async function fetchVenueByName(venueName: string) {
  const res = await apiFetch(`/api/venues/${venueName}`);
  if (!res.ok) throw new Error("Failed to fetch venue details");
  return res.json();
}
