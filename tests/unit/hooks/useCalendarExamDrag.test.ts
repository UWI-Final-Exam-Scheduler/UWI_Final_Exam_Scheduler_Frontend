import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { useCalendarExamDrag } from "@/app/hooks/useCalendarExamDrag";
import type { CalendarMoveActions, Exam, Venue } from "@/app/components/types/calendarTypes";
import { mockExam } from "../mocks/examMockData";
import { mockVenues } from "../mocks/venueMockData";

// ── fixtures ──────────────────────────────────────────────────────────────────

// A scheduled exam at 9 AM, venue 1
const exam1 = mockExam({
  id: 1,
  courseCode: "COMP1601",
  timeColumnId: "9",
  time: 9,
  exam_date: "2025-05-12",
  venue_id: 1,
});

// A reschedule exam (timeColumnId "0")
const rescheduleExam = mockExam({
  id: 2,
  courseCode: "MATH1115",
  timeColumnId: "0",
  time: 0,
  exam_date: "2025-05-12",
  venue_id: 1,
});

/**
 * Build a minimal DragEndEvent.
 * overId format: "<timeColumnId>-<venueId>" (e.g. "1-1") or just "<timeColumnId>" (e.g. "0")
 */
function makeDrag(
  activeId: string | number,
  overId: string | number,
  draggedExam: Exam = exam1,
): DragEndEvent {
  return {
    active: { id: activeId, data: { current: { exam: draggedExam } } },
    over: { id: overId },
  } as unknown as DragEndEvent;
}

// ── hook factory ──────────────────────────────────────────────────────────────

describe("useCalendarExamDrag", () => {
  let exams: Exam[];
  let rescheduleExams: Exam[];
  let allScheduledExams: Exam[];
  let selectedDateRef: { current: Date };
  let fetchDaysWithExams: ReturnType<typeof vi.fn>;
  let moveActions: CalendarMoveActions;
  let venues: Venue[];
  let wouldExceedCapacity: ReturnType<typeof vi.fn>;
  let occupancyMap: Record<number, Record<string, number>>;

  beforeEach(() => {
    exams = [exam1];
    rescheduleExams = [];
    allScheduledExams = [exam1];
    selectedDateRef = { current: new Date("2025-05-12T12:00:00") };
    fetchDaysWithExams = vi.fn().mockResolvedValue(undefined);
    moveActions = {
      handleMoveToReschedule: vi.fn().mockResolvedValue(undefined),
      handleMoveFromReschedule: vi.fn().mockResolvedValue(undefined),
      handleSameDayTimeChange: vi.fn().mockResolvedValue(undefined),
    };
    venues = mockVenues();
    wouldExceedCapacity = vi.fn().mockReturnValue(false);
    occupancyMap = {};
  });

  function makeHook() {
    return renderHook(() =>
      useCalendarExamDrag(
        exams,
        rescheduleExams,
        allScheduledExams,
        selectedDateRef as React.RefObject<Date | undefined>,
        fetchDaysWithExams,
        moveActions,
        venues,
        wouldExceedCapacity,
        occupancyMap,
      ),
    );
  }

  // ── initial state ───────────────────────────────────────────────────────────

  it("starts with alertOpen false, no pendingMove, and no warnings", () => {
    const { result } = makeHook();
    expect(result.current.alertOpen).toBe(false);
    expect(result.current.pendingMove).toBeNull();
    expect(result.current.capacityWarningOpen).toBe(false);
    expect(result.current.splitConflictOpen).toBe(false);
  });

  // ── valid drag ──────────────────────────────────────────────────────────────

  it("opens the confirmation alert and sets pendingMove when the exam moves to a different slot", () => {
    const { result } = makeHook();

    // exam1 is at "9-1"; drop on "1-1" (different time, same venue)
    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1"));
    });

    expect(result.current.alertOpen).toBe(true);
    expect(result.current.pendingMove).not.toBeNull();
    expect(result.current.pendingMove?.toColumnId).toBe("1");
  });

  it("does nothing when the exam is dropped on its own slot", () => {
    const { result } = makeHook();

    // exam1 timeColumnId "9", venue_id 1 → dropping on "9-1" is a no-op
    act(() => {
      result.current.handleExamDrag(makeDrag("1", "9-1"));
    });

    expect(result.current.alertOpen).toBe(false);
    expect(result.current.pendingMove).toBeNull();
  });

  it("does nothing when over is null (drag cancelled)", () => {
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag({
        active: { id: "1", data: { current: { exam: exam1 } } },
        over: null,
      } as unknown as DragEndEvent);
    });

    expect(result.current.alertOpen).toBe(false);
  });

  // ── capacity warning ────────────────────────────────────────────────────────

  it("shows capacity warning and blocks the move when venue would overflow", () => {
    wouldExceedCapacity.mockReturnValue(true);
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1"));
    });

    expect(result.current.capacityWarningOpen).toBe(true);
    expect(result.current.capacityWarningInfo).not.toBeNull();
    expect(result.current.alertOpen).toBe(false); // move dialog must NOT open
  });

  it("clears the capacity warning on dismiss", () => {
    wouldExceedCapacity.mockReturnValue(true);
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1"));
    });
    act(() => {
      result.current.handleDismissCapacityWarning();
    });

    expect(result.current.capacityWarningOpen).toBe(false);
    expect(result.current.capacityWarningInfo).toBeNull();
  });

  // ── split conflict ──────────────────────────────────────────────────────────

  it("shows a split conflict when dragging a split to a different slot than its sibling", () => {
    // Sibling of exam1: same course, same date, same time (9:00 on 2025-05-12)
    const sibling = mockExam({
      id: 3,
      courseCode: "COMP1601",
      timeColumnId: "9",
      time: 9,
      exam_date: "2025-05-12",
      venue_id: 2,
    });

    // Both exam1 and sibling are scheduled
    allScheduledExams = [exam1, sibling];
    const { result } = makeHook();

    // Drag exam1 to "1-1" → target = 2025-05-12|1, sibling is at 2025-05-12|9 → conflict
    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1"));
    });

    expect(result.current.splitConflictOpen).toBe(true);
    expect(result.current.splitConflictInfo?.courseCode).toBe("COMP1601");
  });

  it("clears the split conflict on dismiss", () => {
    const sibling = mockExam({
      id: 3,
      courseCode: "COMP1601",
      timeColumnId: "9",
      time: 9,
      exam_date: "2025-05-12",
      venue_id: 2,
    });
    allScheduledExams = [exam1, sibling];
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1"));
    });
    act(() => {
      result.current.handleDismissSplitConflict();
    });

    expect(result.current.splitConflictOpen).toBe(false);
    expect(result.current.splitConflictInfo).toBeNull();
  });

  // ── cancel / confirm ────────────────────────────────────────────────────────

  it("handleCancelMove closes the alert and clears pendingMove", () => {
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1"));
    });
    expect(result.current.alertOpen).toBe(true);

    act(() => {
      result.current.handleCancelMove();
    });

    expect(result.current.alertOpen).toBe(false);
    expect(result.current.pendingMove).toBeNull();
  });

  it("handleConfirmMove routes to handleSameDayTimeChange for calendar-to-calendar drag", async () => {
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag(makeDrag("1", "1-1")); // "9" → "1", both calendar
    });

    await act(async () => {
      await result.current.handleConfirmMove();
    });

    expect(moveActions.handleSameDayTimeChange).toHaveBeenCalledTimes(1);
    expect(result.current.alertOpen).toBe(false);
    expect(result.current.pendingMove).toBeNull();
  });

  it("handleConfirmMove routes to handleMoveToReschedule when dragging to column 0", async () => {
    const { result } = makeHook();

    act(() => {
      result.current.handleExamDrag(makeDrag("1", "0")); // drop on reschedule column
    });

    await act(async () => {
      await result.current.handleConfirmMove();
    });

    expect(moveActions.handleMoveToReschedule).toHaveBeenCalledTimes(1);
  });

  it("handleConfirmMove routes to handleMoveFromReschedule for reschedule-to-calendar drag", async () => {
    // Set up with a reschedule exam being dragged
    exams = [];
    rescheduleExams = [rescheduleExam];
    allScheduledExams = [exam1]; // only COMP1601 is scheduled; MATH1115 is not

    const { result } = makeHook();

    act(() => {
      // rescheduleExam (MATH1115, col "0") → drop on "1-1"
      result.current.handleExamDrag(makeDrag("2", "1-1", rescheduleExam));
    });

    await act(async () => {
      await result.current.handleConfirmMove();
    });

    expect(moveActions.handleMoveFromReschedule).toHaveBeenCalledTimes(1);
  });
});
