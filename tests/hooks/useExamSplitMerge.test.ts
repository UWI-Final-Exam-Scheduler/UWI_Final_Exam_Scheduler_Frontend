import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExamSplitMerge } from "@/app/hooks/useExamSplitMerge";
import { mockExam } from "../mocks/examMockData";
import { Exam } from "@/app/components/types/calendarTypes";

// Mock toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock API calls
vi.mock("@/app/lib/examFetch", () => ({
  splitExam: vi.fn(),
  mergeExam: vi.fn(),
  rescheduleExam: vi.fn(),
}));

import { toast } from "react-hot-toast";
import { mergeExam, rescheduleExam, splitExam } from "@/app/lib/examFetch";

describe("useExamSplitMerge & toast notifications", () => {
  const exam1 = mockExam({ id: 1, courseCode: "COMP1601", timeColumnId: "9" });
  const exam2 = mockExam({ id: 2, courseCode: "COMP1601", timeColumnId: "9" });

  let exams: Exam[];
  let rescheduledExams: Exam[];
  let setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  let setRescheduledExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  let refetch: () => Promise<void>;

  beforeEach(() => {
    exams = [exam1, exam2];
    setExams = vi.fn() as unknown as React.Dispatch<
      React.SetStateAction<Exam[]>
    >;
    rescheduledExams = [];
    setRescheduledExams = vi.fn() as unknown as React.Dispatch<
      React.SetStateAction<Exam[]>
    >;
    refetch = vi.fn(async () => {}) as unknown as () => Promise<void>;
  });

  it("should open split dialog when onSplit is called", () => {
    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onSplit(exam1);
    });

    expect(result.current.splitDialogOpen).toBe(true);
    expect(result.current.activeExam).toEqual(exam1);
  });

  it("should open merge dialog when onMerge is called", () => {
    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onMerge(exam1);
    });

    expect(result.current.mergeDialogOpen).toBe(true);
    expect(result.current.activeExam).toEqual(exam1);
  });

  it("should close split dialog and clear activeExam on onCloseSplit", () => {
    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onSplit(exam1);
    });
    act(() => {
      result.current.onCloseSplit();
    });

    expect(result.current.splitDialogOpen).toBe(false);
    expect(result.current.activeExam).toBeNull();
  });

  it("should close merge dialog and clear activeExam on onCloseMerge", () => {
    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onMerge(exam1);
    });
    act(() => {
      result.current.onCloseMerge();
    });

    expect(result.current.mergeDialogOpen).toBe(false);
    expect(result.current.activeExam).toBeNull();
  });

  // --- Toast: Merge success ---
  it('should show success toast "Exams merged successfully" on normal merge', async () => {
    const mergedExam = mockExam({
      id: 99,
      courseCode: "COMP1601",
      timeColumnId: "9",
    });
    vi.mocked(mergeExam).mockResolvedValue([mergedExam]);

    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onMerge(exam1);
    });

    await act(async () => {
      await result.current.onMergeConfirm([1, 2], false);
    });

    expect(toast.success).toHaveBeenCalledWith("Exams merged successfully");
  });

  // --- Toast: Merge with reschedule ---
  it('should show "Merged exam moved to reschedule due to capacity" when moveToReschedule=true', async () => {
    const mergedExam = mockExam({
      id: 99,
      courseCode: "COMP1601",
      timeColumnId: "9",
    });
    const rescheduledExam = { ...mergedExam, timeColumnId: "0", time: 0 };
    vi.mocked(mergeExam).mockResolvedValue([mergedExam]);
    vi.mocked(rescheduleExam).mockResolvedValue(rescheduledExam);

    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onMerge(exam1);
    });

    await act(async () => {
      await result.current.onMergeConfirm([1, 2], true);
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Merged exam moved to reschedule due to capacity",
    );
  });

  // --- Toast: Merge error ---
  it("should show error toast when merge fails", async () => {
    vi.mocked(mergeExam).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onMerge(exam1);
    });

    await act(async () => {
      await result.current.onMergeConfirm([1, 2], false);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to merge exams");
  });

  // --- ExamSplits computed ---
  it("should return all splits for the active exam course code", () => {
    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    act(() => {
      result.current.onMerge(exam1);
    });

    // Both exam1 and exam2 are COMP1601
    expect(result.current.examSplits).toHaveLength(2);
  });

  it("should return empty examSplits when no active exam", () => {
    const { result } = renderHook(() =>
      useExamSplitMerge(
        exams,
        setExams,
        rescheduledExams,
        setRescheduledExams,
        refetch,
      ),
    );

    expect(result.current.examSplits).toHaveLength(0);
  });
});
