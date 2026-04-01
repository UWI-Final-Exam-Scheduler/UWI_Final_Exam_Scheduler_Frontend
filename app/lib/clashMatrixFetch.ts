import { apiFetch } from "./apiFetch";

type ClashMatrixResponse = {
  conflicting_courses: Array<{
    course1: string;
    course2: string;
    clash_count: number;
  }>;
  courses_with_clashes: string[];
  total_conflicts: number;
  unique_courses_with_conflicts: number;
  total_students_affected: number;
  percentage_students_affected: number;
};

export async function getClashMatrix(
  abs_threshold: number,
  perc_threshold: number,
): Promise<ClashMatrixResponse> {
  const response = await apiFetch(
    `/api/clash-matrix?abs_threshold=${abs_threshold}&perc_threshold=${perc_threshold}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch clash matrix. Refresh to try again.");
  }

  const data = await response.json();

  return {
    conflicting_courses: data.conflicting_courses || [],
    courses_with_clashes: data.courses_with_clashes || [],
    total_conflicts: data.total_conflicts || 0,
    unique_courses_with_conflicts: data.unique_courses_with_conflicts || 0,
    total_students_affected: data.total_students_affected || 0,
    percentage_students_affected: data.percentage_students_affected || 0,
  };
}