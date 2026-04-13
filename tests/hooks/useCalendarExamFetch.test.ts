import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { Exam, Venue } from "@/app/components/types/calendarTypes";

const { mockSetExams, mockSetRescheduleExams, mockSetAllScheduledExams } =
  vi.hoisted(() => ({
    mockSetExams: vi.fn(),
    mockSetRescheduleExams: vi.fn(),
    mockSetAllScheduledExams: vi.fn(),
  }));

vi.mock("@/app/state_management/examStore", () => ({
  useExamStore: () => ({
    exams: [],
    setExams: mockSetExams,
    rescheduleExams: [],
    setRescheduleExams: mockSetRescheduleExams,
    allScheduledExams: [],
    setAllScheduledExams: mockSetAllScheduledExams,
  }),
}));

vi.mock("@/app/lib/examFetch", () => ({
  get_days_with_exams: vi.fn(),
  fetchExamstobeRescheduled: vi.fn(),
  formatDatetoString: vi.fn((date: Date) => date.toISOString().split("T")[0]),
  examFetchbyDate: vi.fn(),
}));

vi.mock("@/app/lib/venueFetch", () => ({
  venueFetch: vi.fn(),
}));

import { useCalendarExamFetch } from "@/app/hooks/useCalendarExamFetch";
import * as examFetch from "@/app/lib/examFetch";
import * as venueFetch from "@/app/lib/venueFetch";

// ── fixtures ───────────────────────────────────────────────────────────────
const makeExam = (overrides: Partial<Exam> = {}): Exam => ({
  id: 1,
  courseCode: "COMP3603",
  exam_date: "2024-03-15",
  date: null,
  time: 9,
  venue_id: 1,
  number_of_students: 50,
  timeColumnId: "9",
  exam_length: 2,
  ...overrides,
});

const mockExam = makeExam();
const mockVenue: Venue = { id: 1, name: "Hall A", capacity: 100 };

describe("useCalendarExamFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(examFetch.get_days_with_exams).mockResolvedValue([
      "2024-03-15",
      "2024-03-16",
    ]);
    vi.mocked(examFetch.fetchExamstobeRescheduled).mockResolvedValue([]);
    vi.mocked(examFetch.examFetchbyDate).mockResolvedValue([mockExam]);
    vi.mocked(venueFetch.venueFetch).mockResolvedValue([mockVenue]);
  });

  it("initializes with loading states", () => {
    const { result } = renderHook(() => useCalendarExamFetch(undefined));
    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isRescheduleLoading).toBe(true);
  });

  it("fetches venues on mount", async () => {
    renderHook(() => useCalendarExamFetch(undefined));
    await waitFor(() => {
      expect(venueFetch.venueFetch).toHaveBeenCalled();
    });
  });

  it("fetches days with exams on mount", async () => {
    renderHook(() => useCalendarExamFetch(undefined));
    await waitFor(() => {
      expect(examFetch.get_days_with_exams).toHaveBeenCalled();
    });
  });

  it("returns venues after fetching", async () => {
    const { result } = renderHook(() => useCalendarExamFetch(undefined));
    await waitFor(() => {
      expect(result.current.venues).toContainEqual(mockVenue);
    });
  });

  it("returns days with exams as Date objects", async () => {
    const { result } = renderHook(() => useCalendarExamFetch(undefined));
    await waitFor(() => {
      expect(result.current.haveExamsDay).toHaveLength(2);
      expect(result.current.haveExamsDay[0]).toBeInstanceOf(Date);
    });
  });

  it("fetches exams for a weekday", async () => {
    const friday = new Date(2024, 2, 15); // Friday, March 15
    renderHook(() => useCalendarExamFetch(friday));
    await waitFor(() => {
      expect(examFetch.examFetchbyDate).toHaveBeenCalled();
    });
  });

  it("calls setExams with [] for weekend dates", async () => {
    const saturday = new Date(2024, 2, 16); // Saturday, March 16
    renderHook(() => useCalendarExamFetch(saturday));
    await waitFor(() => {
      expect(mockSetExams).toHaveBeenCalledWith([]);
    });
  });

  it("has selectedDateRef available", () => {
    const { result } = renderHook(() => useCalendarExamFetch(undefined));
    expect(result.current.selectedDateRef).toBeDefined();
    expect(result.current.selectedDateRef.current).toBeUndefined();
  });

  it("updates selectedDateRef when date prop changes", async () => {
    const { result, rerender } = renderHook(
      ({ date }: { date: Date | undefined }) => useCalendarExamFetch(date),
      { initialProps: { date: undefined as Date | undefined } },
    );

    const newDate = new Date(2024, 2, 15);
    rerender({ date: newDate });

    await waitFor(() => {
      expect(result.current.selectedDateRef.current).toEqual(newDate);
    });
  });

  // ── these two must wait for initialization to finish before calling the
  //    returned functions, otherwise act() is fighting the init effect ──────

  it("exposes fetchRescheduleExams function and it calls the API", async () => {
    const { result } = renderHook(() => useCalendarExamFetch(undefined));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(typeof result.current.fetchRescheduleExams).toBe("function");

    vi.mocked(examFetch.fetchExamstobeRescheduled).mockClear();

    await act(async () => {
      await result.current.fetchRescheduleExams();
    });

    expect(examFetch.fetchExamstobeRescheduled).toHaveBeenCalledTimes(1);
  });

  it("exposes fetchDaysWithExams function and it calls the API", async () => {
    const { result } = renderHook(() => useCalendarExamFetch(undefined));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(typeof result.current.fetchDaysWithExams).toBe("function");

    vi.mocked(examFetch.get_days_with_exams).mockClear();

    await act(async () => {
      await result.current.fetchDaysWithExams();
    });

    expect(examFetch.get_days_with_exams).toHaveBeenCalledTimes(1);
  });

  it("exposes refreshSelectedDateExams function", async () => {
    const weekday = new Date(2024, 2, 15);
    const { result } = renderHook(() => useCalendarExamFetch(weekday));

    expect(typeof result.current.refreshSelectedDateExams).toBe("function");

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });
  });

  it("handles fetch errors gracefully during initialization", async () => {
    vi.mocked(examFetch.get_days_with_exams).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useCalendarExamFetch(undefined));

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
      expect(result.current.haveExamsDay).toEqual([]);
    });
  });

  it("handles fetch errors when fetching exams by date", async () => {
    vi.mocked(examFetch.examFetchbyDate).mockRejectedValue(
      new Error("Fetch failed"),
    );

    const weekday = new Date(2024, 2, 15);
    const { result } = renderHook(() => useCalendarExamFetch(weekday));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("safely handles partial fetch failures using Promise.allSettled", async () => {
    vi.mocked(examFetch.examFetchbyDate)
      .mockResolvedValueOnce([mockExam]) // day 1 succeeds
      .mockRejectedValueOnce(new Error("Day 2 failed")); // day 2 fails

    renderHook(() => useCalendarExamFetch(undefined));

    await waitFor(() => {
      // Only the successful day's exam should reach setAllScheduledExams
      expect(mockSetAllScheduledExams).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ courseCode: "COMP3603" }),
        ]),
      );
      const lastCall = mockSetAllScheduledExams.mock.calls.at(-1)![0] as Exam[];
      expect(lastCall).toHaveLength(1);
    });
  });
});
