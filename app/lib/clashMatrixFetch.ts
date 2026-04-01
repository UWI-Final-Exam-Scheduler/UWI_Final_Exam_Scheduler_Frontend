import { apiFetch } from "./apiFetch";

// Fetch the clash matrix for ALL courses (after the default thresholds have been applied i.e 5 and 10%)
export async function getClashMatrix(
  abs_threshold: number,
  perc_threshold: number,
): Promise<{
  clashes: Array<{
    course: string;
    clashes: Array<{ other_course: string; clash_count: number }>;
  }>;
  unique_courses_with_conflicts: number;
}> {
  const response = await apiFetch(
    `/api/clash-matrix?abs_threshold=${abs_threshold}&perc_threshold=${perc_threshold}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch global clash matrix");
  }

  const data = await response.json();
  return {
    clashes: data.clashes || [],
    unique_courses_with_conflicts: data.unique_courses_with_conflicts || 0,
  };
}
