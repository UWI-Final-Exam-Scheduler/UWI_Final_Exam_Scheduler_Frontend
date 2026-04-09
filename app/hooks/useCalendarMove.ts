// app/hooks/useCalendarMove.ts
import { PendingMove, Venue, Exam } from "../components/types/calendarTypes";
import {
  formatDatetoString,
  rescheduleExam,
  examFetchbyDate,
} from "../lib/examFetch";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";
import { useExamStore } from "../state_management/examStore";

export function useCalendarMove(
  venues: Venue[],
  fetchRescheduleExams: (showLoading?: boolean) => Promise<void>,
  fetchDaysWithExams: () => Promise<void>,
) {
  const store = useExamStore();

  const getMoveExamId = (move: PendingMove): number => {
    const parsed = Number(move.examId ?? move.exam.id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Invalid exam id for move operation");
    }
    return parsed;
  };

  async function handleMoveToReschedule(move: PendingMove) {
    const moveExamId = getMoveExamId(move);
    const snapshot = {
      exams: [...store.exams],
      rescheduleExams: [...store.rescheduleExams],
      allScheduledExams: [...store.allScheduledExams],
    };

    try {
      await rescheduleExam(moveExamId, 0, null, null, true, true);

      // Apply once backend confirms to avoid optimistic flicker.
      store.setExams((prev) => prev.filter((e) => e.id !== moveExamId));
      store.setAllScheduledExams((prev) =>
        prev.filter((e) => e.id !== moveExamId),
      );
      store.setRescheduleExams((prev) => [
        ...prev.filter((e) => e.id !== moveExamId),
        { ...move.exam, timeColumnId: "0" },
      ]);

      addLog({
        action: "Move Exam to Reschedule",
        entityId: move.exam.courseCode,
        oldValue: `Time: ${move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
        newValue: "To Be Rescheduled",
      });

      toast.success("Exam moved to reschedule");
      await fetchRescheduleExams(false);
      await fetchDaysWithExams();
    } catch (err) {
      store.restoreSnapshot(snapshot);
      toast.error("Failed to move exam — please try again");
      console.error("handleMoveToReschedule failed:", err);
    }
  }

  async function handleMoveFromReschedule(
    move: PendingMove,
    currentDate: Date,
  ) {
    const moveExamId = getMoveExamId(move);
    const newDateStr = formatDatetoString(currentDate);
    const courseCode = move.exam.courseCode;

    if (!move.toVenueId) {
      toast.error("Select a venue before scheduling this exam.");
      return;
    }

    const targetVenue = venues.find((v) => v.id === move.toVenueId);

    const existingSameCourseInTarget = store.allScheduledExams.filter(
      (e) =>
        e.courseCode === courseCode &&
        e.exam_date === newDateStr &&
        String(e.timeColumnId) === String(move.toColumnId) &&
        e.venue_id === move.toVenueId,
    );

    // Auto-merge only if same-course split already exists in target slot and capacity allows it.
    if (existingSameCourseInTarget.length > 0 && targetVenue) {
      const existingTotal = existingSameCourseInTarget.reduce(
        (sum, e) => sum + e.number_of_students,
        0,
      );
      const mergedTotal = existingTotal + move.exam.number_of_students;

      if (mergedTotal > targetVenue.capacity) {
        toast.error(
          `Cannot auto-merge ${courseCode}: ${mergedTotal}/${targetVenue.capacity} exceeds venue capacity.`,
        );
        return;
      }
    }

    const snapshot = {
      exams: [...store.exams],
      rescheduleExams: [...store.rescheduleExams],
      allScheduledExams: [...store.allScheduledExams],
    };

    try {
      await rescheduleExam(
        moveExamId,
        Number(move.toColumnId),
        newDateStr,
        move.toVenueId,
        false,
      );

      // Hard reconcile selected-day exams from backend truth.
      const refreshed = await examFetchbyDate(newDateStr);
      store.setExams(
        refreshed.map((exam: Exam) => ({
          ...exam,
          timeColumnId: String(exam.time),
        })),
      );

      addLog({
        action: "Move Exam from Reschedule",
        entityId: courseCode,
        oldValue: "To Be Rescheduled",
        newValue: `Time: ${move.toColumnId}, Date: ${newDateStr}, Venue: ${move.toVenueId}`,
      });

      toast.success("Exam moved to calendar");
      await fetchRescheduleExams(false);
      await fetchDaysWithExams();
    } catch (err) {
      store.restoreSnapshot(snapshot);
      toast.error("Failed to move exam, please try again");
      console.error("handleMoveFromReschedule failed:", err);
    }
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    const moveExamId = getMoveExamId(move);

    const updatedExam: Exam = {
      ...move.exam,
      time: Number(move.toColumnId),
      timeColumnId: move.toColumnId,
      venue_id: move.toVenueId ?? move.exam.venue_id,
    };

    // update first
    store.setExams((prev) => [
      ...prev.filter((e) => e.id !== moveExamId),
      updatedExam,
    ]);
    store.setAllScheduledExams((prev) => [
      ...prev.filter((e) => e.id !== moveExamId),
      updatedExam,
    ]);

    try {
      await rescheduleExam(
        moveExamId,
        Number(move.toColumnId),
        undefined,
        move.toVenueId ?? null,
        false,
      );

      addLog({
        action: "Move Exam Same Day",
        entityId: move.exam.courseCode,
        oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
        newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
      });

      toast.success("Exam moved successfully");

      fetchRescheduleExams();
      fetchDaysWithExams();
    } catch (err) {
      // Rollback
      store.setExams((prev) => [
        ...prev.filter((e) => e.id !== moveExamId),
        move.exam,
      ]);
      store.setAllScheduledExams((prev) => [
        ...prev.filter((e) => e.id !== moveExamId),
        move.exam,
      ]);
      toast.error("Failed to move exam — please try again");
      console.error("handleSameDayTimeChange failed:", err);
    }
  }

  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
