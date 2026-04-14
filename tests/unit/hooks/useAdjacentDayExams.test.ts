import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAdjacentDayExams } from "@/app/hooks/useAdjacentDayExams";
import { mockExam } from "../mocks/examMockData";

vi.mock("@/app/lib/examFetch", () => ({
  examFetchbyDate: vi.fn(),
  // Use local date components to avoid UTC/timezone shift (same approach as useCalendarExamFetch tests)
  formatDatetoString: vi.fn(
    (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
  ),
}));

import { examFetchbyDate } from "@/app/lib/examFetch";

describe("useAdjacentDayExams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(examFetchbyDate).mockResolvedValue([]);
  });

  it("returns empty arrays and never fetches when selectedDate is undefined", () => {
    const { result } = renderHook(() => useAdjacentDayExams(undefined));
    expect(result.current.prevDayExams).toEqual([]);
    expect(result.current.nextDayExams).toEqual([]);
    expect(examFetchbyDate).not.toHaveBeenCalled();
  });

  it("fetches exams for both adjacent weekdays on mount", async () => {
    // Wednesday 2025-05-14: prev = Tue 2025-05-13, next = Thu 2025-05-15
    renderHook(() => useAdjacentDayExams(new Date("2025-05-14T12:00:00")));
    await waitFor(() => {
      expect(examFetchbyDate).toHaveBeenCalledTimes(2);
    });
  });

  it("populates prevDayExams and nextDayExams from API responses", async () => {
    const prevExam = mockExam({ id: 1, courseCode: "COMP1601" });
    const nextExam = mockExam({ id: 2, courseCode: "MATH1115" });
    vi.mocked(examFetchbyDate)
      .mockResolvedValueOnce([prevExam]) // called first for prev day
      .mockResolvedValueOnce([nextExam]); // called second for next day

    // Create the date outside the callback so the same reference is used across
    // renders, preventing the effect from being cancelled and re-run.
    const date = new Date("2025-05-14T12:00:00");
    const { result } = renderHook(() => useAdjacentDayExams(date));

    // act(async) flushes the microtask queue so Promise.allSettled resolves and
    // React batches + commits the setState calls before we check.
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.prevDayExams).toHaveLength(1);
    expect(result.current.prevDayExams[0].courseCode).toBe("COMP1601");
    expect(result.current.nextDayExams).toHaveLength(1);
    expect(result.current.nextDayExams[0].courseCode).toBe("MATH1115");
  });

  it("skips Saturday and Sunday when computing previous weekday from Monday", async () => {
    // Monday 2025-05-12 → previous weekday = Friday 2025-05-09
    renderHook(() => useAdjacentDayExams(new Date("2025-05-12T12:00:00")));
    await waitFor(() => {
      expect(examFetchbyDate).toHaveBeenCalledWith("2025-05-09");
    });
  });

  it("skips Saturday and Sunday when computing next weekday from Friday", async () => {
    // Friday 2025-05-09 → next weekday = Monday 2025-05-12
    renderHook(() => useAdjacentDayExams(new Date("2025-05-09T12:00:00")));
    await waitFor(() => {
      expect(examFetchbyDate).toHaveBeenCalledWith("2025-05-12");
    });
  });

  it("returns empty arrays when the API call fails (allSettled swallows rejections)", async () => {
    vi.mocked(examFetchbyDate).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useAdjacentDayExams(new Date("2025-05-14T12:00:00")),
    );

    await waitFor(() => {
      expect(examFetchbyDate).toHaveBeenCalledTimes(2);
    });

    expect(result.current.prevDayExams).toEqual([]);
    expect(result.current.nextDayExams).toEqual([]);
  });

  it("refetches for both adjacent days when selectedDate changes", async () => {
    const { rerender } = renderHook(
      ({ date }: { date: Date }) => useAdjacentDayExams(date),
      { initialProps: { date: new Date("2025-05-14T12:00:00") } },
    );

    await waitFor(() => {
      expect(examFetchbyDate).toHaveBeenCalledTimes(2);
    });

    rerender({ date: new Date("2025-05-15T12:00:00") });

    await waitFor(() => {
      expect(examFetchbyDate).toHaveBeenCalledTimes(4);
    });
  });
});
