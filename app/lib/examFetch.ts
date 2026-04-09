import { apiFetch } from "./apiFetch";
import { Exam } from "../components/types/calendarTypes";

type ExamApiResponse = Exam & {
  exam_id?: number;
};

function normalizeExam(exam: ExamApiResponse): Exam {
  return {
    ...exam,
    id: exam.id ?? exam.exam_id ?? 0,
    timeColumnId: String(exam.time),
  };
}

export async function examFetchbyDate(date: string) {
  const response = await apiFetch(`/api/exams/${date}`);
  if (!response.ok) {
    const body = await response.text();
    // Backend returns 400 for dates outside the exam period. Treat as empty day.
    if (
      response.status === 400 &&
      body.toLowerCase().includes("outside of the exam period")
    ) {
      return [];
    }
    console.error("Days with exams failed:", response.status, body);
    throw new Error("Failed to fetch exam dates");
  }
  const data = await response.json();
  return (data ?? []).map(normalizeExam);
}

export async function fetchExamstobeRescheduled() {
  const response = await apiFetch(`/api/exams/need_rescheduling`);
  if (!response.ok) throw new Error("Failed to fetch reschedule exams");
  const data = await response.json();
  return (data ?? []).map((exam: ExamApiResponse) => ({
    ...normalizeExam(exam),
    timeColumnId: "0",
  }));
}

export async function rescheduleExam(
  examId: number,
  time: number,
  date?: string | null,
  venueId?: number | null,
  unschedule = false,
  preventMerge = false,
) {
  const response = await apiFetch(`/api/exams/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({
      examId,
      time,
      date,
      venueId,
      unschedule,
      preventMerge,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("Reschedule failed:", response.status, body);
    throw new Error("Failed to reschedule exam");
  }

  const data = await response.json();
  return normalizeExam(data);
}

export async function get_days_with_exams() {
  const response = await apiFetch(`/api/exams/days_with_exams`);
  if (!response.ok) throw new Error("Failed to fetch exam dates");
  const data = await response.json();
  return data ?? [];
}

export function formatDatetoString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatStringtoDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function splitExam(
  examId: number,
  splits: { number_of_students: number }[],
  venueId?: number,
  time?: number | null,
  date?: string | null,
) {
  const response = await apiFetch(`/api/exams/split`, {
    method: "POST",
    body: JSON.stringify({ examId, splits, venueId, time, date }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Split exam failed:", response.status, body);
    throw new Error("Failed to split exam");
  }
  const data = await response.json();
  return (data ?? []).map(normalizeExam);
}

export async function mergeExam(examIds: number[]) {
  const response = await apiFetch(`/api/exams/merge`, {
    method: "POST",
    body: JSON.stringify({ examIds }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("Merge exam failed:", response.status, body);
    throw new Error("Failed to merge exams");
  }
  const data = await response.json();
  return (data ?? []).map(normalizeExam);
}
