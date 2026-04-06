import { Exam, PendingMove } from "../components/types/calendarTypes";
import {
  formatDatetoString,
  rescheduleExam,
  mergeExam,
} from "../lib/examFetch";
import { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";

export function useCalendarMove(
  exams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
) {
  async function handleMoveToReschedule(move: PendingMove) {
    const courseCode = move.exam.courseCode;
    const splits = exams.filter((e) => e.courseCode === courseCode);

    const updatedExam = await rescheduleExam(splits[0].id, 0, null, null, true);

    // Remove all splits from calendar
    setExams((prev) => prev.filter((e) => e.courseCode !== courseCode));

    // Add merged exam from backend to reschedule
    setRescheduleExams((prev) => [
      ...prev,
      {
        ...updatedExam,
        timeColumnId: "0",
      },
    ]);

    addLog({
      action: "Move Exam to Reschedule",
      entityId: courseCode,
      oldValue: `Time: ${move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
      newValue: "To Be Rescheduled",
    });

    toast.success("Exam moved to reschedule 📝");
  }

  async function handleMoveFromReschedule(
    move: PendingMove,
    currentDate: Date,
  ) {
    const newDateStr = formatDatetoString(currentDate);
    const courseCode = move.exam.courseCode;

    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    // Check if other splits already exist in this slot
    const otherSplitsInSlot = exams.filter(
      (e) =>
        e.courseCode === courseCode &&
        e.timeColumnId === move.toColumnId &&
        e.venue_id === move.toVenueId,
    );

    if (otherSplitsInSlot.length > 0) {
      // Auto-merge with existing splits
      try {
        const splitsToMerge = [
          move.exam.id,
          ...otherSplitsInSlot.map((e) => e.id),
        ];

        const merged = await mergeExam(splitsToMerge);

        // Remove from reschedule
        setRescheduleExams((prev: Exam[]) =>
          prev.filter((e: Exam) => e.id !== move.exam.id),
        );

        // Replace old splits with merged result
        setExams((prev) => [
          ...prev.filter((e) => !splitsToMerge.includes(e.id)),
          ...merged.map((m: Exam) => ({
            ...m,
            timeColumnId: move.toColumnId,
            date: newDateStr,
            exam_date: newDateStr,
            venue_id: move.toVenueId!,
          })),
        ]);

        addLog({
          action: "Auto-Merge Exams",
          entityId: courseCode,
          oldValue: `${splitsToMerge.length} splits`,
          newValue: `Merged into ${merged.length} exam(s)`,
        });

        toast.success("Exams auto-merged successfully ✨");
        return;
      } catch (err) {
        console.error("Auto-merge failed:", err);
        toast.error("Failed to auto-merge exams");
      }
    }

    // No merge — just move to calendar
    setRescheduleExams((prev: Exam[]) =>
      prev.filter((e: Exam) => e.id !== move.exam.id),
    );

    setExams((prev: Exam[]) => [
      ...prev,
      {
        ...move.exam,
        date: newDateStr,
        exam_date: newDateStr,
        time: Number(move.toColumnId),
        timeColumnId: move.toColumnId,
        venue_id: move.toVenueId!,
      },
    ]);

    addLog({
      action: "Move Exam from Reschedule",
      entityId: courseCode,
      oldValue: "To Be Rescheduled",
      newValue: `Time: ${move.toColumnId}, Date: ${newDateStr}, Venue: ${move.toVenueId}`,
    });

    toast.success("Exam Rescheduled");
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      undefined,
      move.toVenueId ?? null,
      false,
    );

    // check if there are OTHER splits of the same course in the SAME slot
    const updatedExams = exams.map((exam) =>
      String(exam.id) === move.examId
        ? {
            ...exam,
            time: Number(move.toColumnId),
            timeColumnId: move.toColumnId,
            venue_id: move.toVenueId ?? exam.venue_id,
          }
        : exam,
    );
    setExams(updatedExams);

    // check if there are OTHER splits of the same course in the SAME slot
    const otherSplitsInSlot = updatedExams.filter(
      (e) =>
        e.courseCode === move.exam.courseCode &&
        e.timeColumnId === move.toColumnId &&
        e.venue_id === (move.toVenueId ?? move.exam.venue_id) &&
        String(e.id) !== move.examId, // exclude the moved exam
    );

    // if other splits exist, auto-merge them
    if (otherSplitsInSlot.length > 0) {
      try {
        const splitsToMerge = [
          move.exam.id,
          ...otherSplitsInSlot.map((e) => e.id),
        ];

        const merged = await mergeExam(splitsToMerge);

        // Remove old splits and add merged exam
        setExams((prev) => [
          ...prev.filter((e) => e.courseCode !== move.exam.courseCode),
          ...merged.map((m: Exam) => ({
            ...m,
            timeColumnId: String(m.time),
            date: move.exam.exam_date,
          })),
        ]);

        addLog({
          action: "Auto-Merge Exams",
          entityId: move.exam.courseCode,
          oldValue: `${splitsToMerge.length} splits`,
          newValue: `Merged into ${merged.length} exam(s)`,
        });

        toast.success("Exams auto-merged successfully ✨");
      } catch (err) {
        console.error("Auto-merge failed:", err);
        toast.error("Failed to auto-merge exams");
      }
    } else {
      // No other splits, just log the move
      addLog({
        action: "Move Exam Same Day",
        entityId: move.exam.courseCode,
        oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
        newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
      });

      toast.success("Exam moved successfully");
    }
  }

  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
