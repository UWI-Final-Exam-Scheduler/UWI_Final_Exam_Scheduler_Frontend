import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCalendarExamFetch } from "@/app/hooks/useCalendarExamFetch";
import type { Exam, Venue } from "@/app/components/types/calendarTypes";
import { mockExam } from "../mocks/examMockData";

const { mockSetExams, mockSetRescheduleExams, mockSetAllScheduledExams } =
  vi.hoisted(() => ({
    mockSetExams: vi.fn(),
    mockSetRescheduleExams: vi.fn(),
    mockSetAllScheduledExams: vi.fn(),
  }));

vi.mock("@/app/state_management/examStore", () => ({
  useExamStore: () => ({
    exams: [] as Exam[],
    setExams: mockSetExams,
    rescheduleExams: [] as Exam[],
    setRescheduleExams: mockSetRescheduleExams,
    allScheduledExams: [] as Exam[],
    setAllScheduledExams: mockSetAllScheduledExams,
  }),
}));

vi.mock("@/app/lib/examFetch", () => ({
  get_days_with_exams: vi.fn(),
  fetchExamstobeRescheduled: vi.fn(),
  examFetchbyDate: vi.fn(),
  formatDatetoString: (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-"),
}));

vi.mock("@/app/lib/venueFetch", () => ({
  venueFetch: vi.fn(),
}));

import {
  examFetchbyDate,
  fetchExamstobeRescheduled,
  get_days_with_exams,
} from "@/app/lib/examFetch";
import { venueFetch } from "@/app/lib/venueFetch";

describe("useCalendarExamFetch", () => {
  const mockVenue: Venue = { id: 1, name: "Main Hall", capacity: 100 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get_days_with_exams).mockResolvedValue([]);
    vi.mocked(fetchExamstobeRescheduled).mockResolvedValue([]);
    vi.mocked(examFetchbyDate).mockResolvedValue([]);
    vi.mocked(venueFetch).mockResolvedValue([mockVenue]);
  });

  it("loads venues and reschedule data on mount", async () => {
    vi.mocked(fetchExamstobeRescheduled).mockResolvedValue([
      mockExam({ id: 11, courseCode: "COMP1601", timeColumnId: "0", time: 0 }),
    ]);

    const { result } = renderHook(() => useCalendarExamFetch(undefined));

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    expect(get_days_with_exams).toHaveBeenCalledTimes(1);
    expect(fetchExamstobeRescheduled).toHaveBeenCalledTimes(1);
    expect(venueFetch).toHaveBeenCalledTimes(1);
    expect(mockSetRescheduleExams).toHaveBeenCalledWith([
      expect.objectContaining({
        courseCode: "COMP1601",
        timeColumnId: "0",
      }),
    ]);
  });

  it("fetches weekday exams and normalizes timeColumnId", async () => {
    vi.mocked(examFetchbyDate).mockResolvedValue([
      mockExam({
        id: 21,
        courseCode: "MATH1115",
        exam_date: "2025-05-12",
        date: "2025-05-12",
        time: 9,
        timeColumnId: "9",
      }),
    ]);

    const { result } = renderHook(() =>
      useCalendarExamFetch(new Date("2025-05-12T12:00:00")),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(examFetchbyDate).toHaveBeenCalledWith("2025-05-12");
    expect(mockSetExams).toHaveBeenCalledWith([
      expect.objectContaining({
        courseCode: "MATH1115",
        timeColumnId: "9",
      }),
    ]);
  });

  it("skips weekday fetching for weekend dates and clears exams", async () => {
    const { result } = renderHook(() =>
      useCalendarExamFetch(new Date("2025-05-10T12:00:00")),
    );

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    expect(examFetchbyDate).not.toHaveBeenCalledWith("2025-05-10");
    expect(mockSetExams).toHaveBeenCalledWith([]);
  });
});
