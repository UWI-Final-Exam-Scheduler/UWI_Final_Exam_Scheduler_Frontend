import { apiFetch } from "./apiFetch";

// Type for a single clash row
export type Clash = {
  course: string;
  studentsClashing: number;
};

// Type for a single clash item in the API response
type ClashApiItem = {
  other_course: string;
  clash_count: number;
};

// Fetch and transform clash matrix data for a specific course (eg: Clash matrix for COMP1600)
export async function getClashMatrixForCourse(
  courseCode: string,
  abs_threshold: number,
  perc_threshold: number,
): Promise<Clash[]> {
  const response = await apiFetch(
    `/api/course/${courseCode}/clash-matrix?abs_threshold=${abs_threshold}&perc_threshold=${perc_threshold}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch clash matrix for course");
  }

  const data = await response.json();
  const clashes: ClashApiItem[] = data.clashes || [];
  return clashes.map(
    (c): Clash => ({
      course: c.other_course,
      studentsClashing: c.clash_count,
    }),
  );
}
