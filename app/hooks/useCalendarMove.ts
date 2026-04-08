// app/hooks/useCalendarMove.ts
import { PendingMove, Venue, Exam } from "../components/types/calendarTypes";
import { formatDatetoString, rescheduleExam } from "../lib/examFetch";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";
import { useExamStore } from "../state_management/examStore";

export function useCalendarMove(
  venues: Venue[],
  fetchRescheduleExams: () => Promise<void>,
  fetchDaysWithExams: () => Promise<void>,
) {
  void venues;
  const store = useExamStore();

  const getMoveExamId = (move: PendingMove): number => {
    const parsed = Number(move.examId ?? move.exam.id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Invalid exam id for move operation");
    }
    return parsed;
  };

  async function handleMoveToReschedule(move: PendingMove) {
    const courseCode = move.exam.courseCode;
    const { snapshot, movedExams } =
      store.optimisticMoveToReschedule(courseCode);

    try {
      await Promise.all(
        movedExams.map((e) => rescheduleExam(e.id, 0, null, null, true)),
      );

      addLog({
        action: "Move Exam to Reschedule",
        entityId: courseCode,
        oldValue: `Time: ${move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
        newValue: "To Be Rescheduled",
      });

      toast.success(
        movedExams.length > 1
          ? `${courseCode}: all ${movedExams.length} splits moved to reschedule 📝`
          : "Exam moved to reschedule 📝",
      );
      fetchRescheduleExams();
      fetchDaysWithExams();
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

    const updatedExam: Exam = {
      ...move.exam,
      date: newDateStr,
      exam_date: newDateStr,
      time: Number(move.toColumnId),
      timeColumnId: move.toColumnId,
      venue_id: move.toVenueId!,
    };

    // Optimistic update first
    store.setRescheduleExams((prev) => prev.filter((e) => e.id !== moveExamId));
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
        newDateStr,
        move.toVenueId,
        false,
      );

      addLog({
        action: "Move Exam from Reschedule",
        entityId: courseCode,
        oldValue: "To Be Rescheduled",
        newValue: `Time: ${move.toColumnId}, Date: ${newDateStr}, Venue: ${move.toVenueId}`,
      });

      toast.success("Exam moved to calendar");

      fetchRescheduleExams();
      fetchDaysWithExams();
    } catch (err) {
      // Rollback
      store.setExams((prev) => prev.filter((e) => e.id !== moveExamId));
      store.setAllScheduledExams((prev) =>
        prev.filter((e) => e.id !== moveExamId),
      );
      store.setRescheduleExams((prev) => [
        ...prev.filter((e) => e.id !== moveExamId),
        { ...move.exam, timeColumnId: "0" },
      ]);
      toast.error("Failed to move exam — please try again");
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
