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

export async function fetchCoursesBySubject(
  subjectCode: string,
  page: number,
  perPage: number = 20,
) {
  const res = await apiFetch(
    `/api/courses/subject/${subjectCode}?page=${page}&per_page=${perPage}`,
  );
  if (!res.ok) throw new Error("Failed to fetch courses by subject");
  return res.json();
}

export async function fetchSubjectCodes() {
  const res = await apiFetch("/api/courses/subjects");
  if (!res.ok) throw new Error("Failed to fetch subject codes");
  const subjects = await res.json();
  return subjects.map((code: string) => ({ value: code, label: code }));
}
