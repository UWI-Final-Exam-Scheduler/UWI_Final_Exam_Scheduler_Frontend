import { apiFetch } from "./apiFetch";

export async function courseFetch(page: number, perPage: number = 20) {
  const response = await apiFetch(
    `/api/courses?page=${page}&per_page=${perPage}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
}

export async function fetchCourseByCode(courseCode: string) {
  const res = await apiFetch(`/api/courses/${courseCode}`);
  if (!res.ok) throw new Error("Failed to fetch course details");
  return res.json();
}
