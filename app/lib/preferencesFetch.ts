import { apiFetch } from "./apiFetch";
import { apiPut } from "./apiPut";

export type UserPreferences = {
  abs_threshold: number;
  perc_threshold: number;
};

export async function fetchUserPreferences() {
  const response = await apiFetch("/api/auth/preferences");

  if (!response.ok) {
    throw new Error("Failed to fetch user preferences");
  }

  return response.json();
}

export async function putUserPreferences(data: Partial<UserPreferences>) {
  const response = await apiPut("/api/auth/preferences", data);

  if (!response.ok) {
    throw new Error("Failed to update user preferences");
  }

  return response.json();
}
