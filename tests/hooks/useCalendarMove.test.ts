import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  Exam,
  PendingMove,
  Venue,
} from "@/app/components/types/calendarTypes";

vi.mock("@/app/lib/examFetch", () => ({
  formatDatetoString: vi.fn((date: Date) => date.toISOString().split("T")[0]),
  rescheduleExam: vi.fn(),
  examFetchbyDate: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/lib/activityLog", () => ({
  addLog: vi.fn(),
}));

vi.mock("@/app/state_management/examStore", () => ({
  useExamStore: vi.fn(),
}));

import * as examFetch from "@/app/lib/examFetch";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";
import { useExamStore } from "@/app/state_management/examStore";
import { useCalendarMove } from "@/app/hooks/useCalendarMove";

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

// PendingMove requires examId, exam, fromColumnId, toColumnId, from, to
const makePendingMove = (
  overrides: Partial<PendingMove> = {},
): PendingMove => ({
  examId: "1",
  exam: makeExam(),
  fromColumnId: "9",
  toColumnId: "0",
  from: "calendar",
  to: "reschedule",
  ...overrides,
});

const mockVenue: Venue = { id: 1, name: "Hall A", capacity: 100 };

describe("useCalendarMove", () => {
  const mockStore = {
    exams: [] as Exam[],
    rescheduleExams: [] as Exam[],
    allScheduledExams: [] as Exam[],
    setExams: vi.fn(),
    setRescheduleExams: vi.fn(),
    setAllScheduledExams: vi.fn(),
    restoreSnapshot: vi.fn(),
  };

  const mockFetchRescheduleExams = vi.fn();
  const mockFetchDaysWithExams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.exams = [makeExam()];
    mockStore.allScheduledExams = [makeExam()];
    mockStore.rescheduleExams = [];
    vi.mocked(useExamStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useExamStore>,
    );
    mockFetchRescheduleExams.mockResolvedValue(undefined);
    mockFetchDaysWithExams.mockResolvedValue(undefined);
    vi.mocked(examFetch.rescheduleExam).mockResolvedValue(makeExam());
    vi.mocked(examFetch.examFetchbyDate).mockResolvedValue([]);
  });

  // ── getMoveExamId ──────────────────────────────────────────────────────
  describe("getMoveExamId", () => {
    it("succeeds when examId is a valid numeric string", async () => {
      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({ examId: "1" });
      await expect(handleMoveToReschedule(move)).resolves.not.toThrow();
    });

    it("throws for a non-numeric examId", async () => {
      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({ examId: "invalid" });
      await expect(handleMoveToReschedule(move)).rejects.toThrow(
        "Invalid exam id for move operation",
      );
    });
  });

  // ── handleMoveToReschedule ─────────────────────────────────────────────
  describe("handleMoveToReschedule", () => {
    it("calls rescheduleExam with the correct parameters", async () => {
      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      await handleMoveToReschedule(makePendingMove());

      expect(examFetch.rescheduleExam).toHaveBeenCalledWith(
        1,
        0,
        null,
        null,
        true,
        true,
      );
    });

    it("updates all three store slices on success", async () => {
      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      await handleMoveToReschedule(makePendingMove());

      expect(mockStore.setExams).toHaveBeenCalled();
      expect(mockStore.setAllScheduledExams).toHaveBeenCalled();
      expect(mockStore.setRescheduleExams).toHaveBeenCalled();
    });

    it("logs the move action", async () => {
      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      await handleMoveToReschedule(makePendingMove());

      expect(addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "Move Exam to Reschedule",
          entityId: "COMP3603",
          newValue: "To Be Rescheduled",
        }),
      );
    });

    it("shows success toast", async () => {
      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      await handleMoveToReschedule(makePendingMove());

      expect(toast.success).toHaveBeenCalledWith("Exam moved to reschedule");
    });

    it("restores snapshot and shows error toast on API failure", async () => {
      vi.mocked(examFetch.rescheduleExam).mockRejectedValue(
        new Error("API error"),
      );

      const { handleMoveToReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      await handleMoveToReschedule(makePendingMove());

      expect(mockStore.restoreSnapshot).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ── handleMoveFromReschedule ───────────────────────────────────────────
  describe("handleMoveFromReschedule", () => {
    it("shows error and does not call API when no venue is selected", async () => {
      const { handleMoveFromReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      // toVenueId omitted → undefined
      const move = makePendingMove({ toColumnId: "1", to: "calendar" });
      await handleMoveFromReschedule(move, new Date("2024-03-15"));

      expect(toast.error).toHaveBeenCalledWith(
        "Select a venue before scheduling this exam.",
      );
      expect(examFetch.rescheduleExam).not.toHaveBeenCalled();
    });

    it("rejects a merge that would exceed venue capacity", async () => {
      // Existing split: 80 students in Hall A (capacity 100) at same slot
      mockStore.allScheduledExams = [
        makeExam({
          courseCode: "COMP3603",
          exam_date: "2024-03-15",
          timeColumnId: "9",
          venue_id: 1,
          number_of_students: 80,
        }),
      ];

      const { handleMoveFromReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      // Moving 50 more would give 130 > 100 capacity
      const move = makePendingMove({
        exam: makeExam({ number_of_students: 50 }),
        toColumnId: "9",
        toVenueId: 1,
        to: "calendar",
      });

      await handleMoveFromReschedule(move, new Date("2024-03-15"));

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("exceeds venue capacity"),
      );
      expect(examFetch.rescheduleExam).not.toHaveBeenCalled();
    });

    it("calls rescheduleExam with the correct parameters", async () => {
      const { handleMoveFromReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        toColumnId: "1",
        toVenueId: 1,
        to: "calendar",
      });

      await handleMoveFromReschedule(move, new Date("2024-03-15"));

      expect(examFetch.rescheduleExam).toHaveBeenCalledWith(
        1,
        1,
        "2024-03-15",
        1,
        false,
      );
    });

    it("reconciles selected-day exams from backend after move", async () => {
      vi.mocked(examFetch.examFetchbyDate).mockResolvedValue([makeExam()]);

      const { handleMoveFromReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        toColumnId: "1",
        toVenueId: 1,
        to: "calendar",
      });

      await handleMoveFromReschedule(move, new Date("2024-03-15"));

      expect(examFetch.examFetchbyDate).toHaveBeenCalled();
      expect(mockStore.setExams).toHaveBeenCalled();
    });

    it("restores snapshot on API failure", async () => {
      vi.mocked(examFetch.rescheduleExam).mockRejectedValue(
        new Error("Failed"),
      );

      const { handleMoveFromReschedule } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        toColumnId: "1",
        toVenueId: 1,
        to: "calendar",
      });

      await handleMoveFromReschedule(move, new Date("2024-03-15"));

      expect(mockStore.restoreSnapshot).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ── handleSameDayTimeChange ────────────────────────────────────────────
  describe("handleSameDayTimeChange", () => {
    it("applies optimistic update to exams and allScheduledExams", async () => {
      const { handleSameDayTimeChange } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        fromColumnId: "9",
        toColumnId: "1",
        toVenueId: 1,
        from: "calendar",
        to: "calendar",
      });

      await handleSameDayTimeChange(move);

      expect(mockStore.setExams).toHaveBeenCalled();
      expect(mockStore.setAllScheduledExams).toHaveBeenCalled();
    });

    it("calls rescheduleExam with same-day parameters", async () => {
      const { handleSameDayTimeChange } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        toColumnId: "1",
        toVenueId: 1,
        from: "calendar",
        to: "calendar",
      });

      await handleSameDayTimeChange(move);

      expect(examFetch.rescheduleExam).toHaveBeenCalledWith(
        1,
        1,
        undefined,
        1,
        false,
      );
    });

    it("rolls back optimistic update and shows error on API failure", async () => {
      vi.mocked(examFetch.rescheduleExam).mockRejectedValue(
        new Error("Failed"),
      );

      const { handleSameDayTimeChange } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        toColumnId: "1",
        toVenueId: 1,
        from: "calendar",
        to: "calendar",
      });

      await handleSameDayTimeChange(move);

      // setExams called twice: once optimistically, once to roll back
      expect(mockStore.setExams).toHaveBeenCalledTimes(2);
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to move exam — please try again",
      );
    });

    it("logs the same-day move action on success", async () => {
      const { handleSameDayTimeChange } = useCalendarMove(
        [mockVenue],
        mockFetchRescheduleExams,
        mockFetchDaysWithExams,
      );

      const move = makePendingMove({
        toColumnId: "1",
        toVenueId: 1,
        from: "calendar",
        to: "calendar",
      });

      await handleSameDayTimeChange(move);

      expect(addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "Move Exam Same Day",
          entityId: "COMP3603",
        }),
      );
    });
  });
});
