import { Exam, PendingMove } from "../components/types/calendarTypes";
import { formatDatetoString, rescheduleExam } from "../lib/examFetch";
import { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";
import { Venue } from "../components/types/calendarTypes";

export function useCalendarMove(
  exams: Exam[],
  rescheduleExams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
  venues: Venue[],
  fetchRescheduleExams: () => Promise<void>,
  fetchDaysWithExams: () => Promise<void>,
) {
  void venues; // Marking venues as intentionally unused

  const getMoveExamId = (move: PendingMove): number => {
    const parsed = Number(move.examId ?? move.exam.id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Invalid exam id for move operation");
    }
    return parsed;
  };

  async function handleMoveToReschedule(move: PendingMove) {
    const moveExamId = getMoveExamId(move);
    const courseCode = move.exam.courseCode;

    const updatedExam = await rescheduleExam(moveExamId, 0, null, null, true);

    // Move only this split to reschedule; keep sibling splits where they are.
    setExams((prev) => prev.filter((e) => e.id !== moveExamId));

    setRescheduleExams((prev) => [
      // Only replace the moved split and preserve local split size.
      ...prev.filter((e) => e.id !== moveExamId),
      {
        ...updatedExam,
        id: moveExamId,
        courseCode: move.exam.courseCode,
        exam_length: move.exam.exam_length,
        number_of_students: move.exam.number_of_students,
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
    // Refresh from backend to avoid stale IDs
    await fetchRescheduleExams();
    await fetchDaysWithExams();
  }

  async function handleMoveFromReschedule(
    move: PendingMove,
    currentDate: Date,
  ) {
    const moveExamId = getMoveExamId(move);
    const newDateStr = formatDatetoString(currentDate);
    const courseCode = move.exam.courseCode;

    await rescheduleExam(
      moveExamId,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    // Always keep splits as separate objects, never merge automatically
    setRescheduleExams((prev: Exam[]) =>
      prev.filter((e: Exam) => e.id !== moveExamId),
    );

    setExams((prev: Exam[]) => {
      // Remove only the moved split, keep all others (even if same course/venue/time)
      const filtered = prev.filter((e) => e.id !== moveExamId);
      return [
        ...filtered,
        {
          ...move.exam,
          date: newDateStr,
          exam_date: newDateStr,
          time: Number(move.toColumnId),
          timeColumnId: move.toColumnId,
          venue_id: move.toVenueId!,
        },
      ];
    });

    addLog({
      action: "Move Exam from Reschedule",
      entityId: courseCode,
      oldValue: "To Be Rescheduled",
      newValue: `Time: ${move.toColumnId}, Date: ${newDateStr}, Venue: ${move.toVenueId}`,
    });

    toast.success("Exam moved to calendar");
    // Refresh from backend to avoid stale IDs
    await fetchRescheduleExams();
    await fetchDaysWithExams();
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    const moveExamId = getMoveExamId(move);
    await rescheduleExam(
      moveExamId,
      Number(move.toColumnId),
      undefined,
      move.toVenueId ?? null,
      false,
    );

    // Always keep splits as separate objects, never merge automatically
    setExams((prev: Exam[]) => {
      // Remove only the moved split, keep all others (even if same course/venue/time)
      const filtered = prev.filter((e) => e.id !== moveExamId);
      return [
        ...filtered,
        {
          ...move.exam,
          time: Number(move.toColumnId),
          timeColumnId: move.toColumnId,
          venue_id: move.toVenueId ?? move.exam.venue_id,
        },
      ];
    });

    addLog({
      action: "Move Exam Same Day",
      entityId: move.exam.courseCode,
      oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
      newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
    });

    toast.success("Exam moved successfully");
    // Refresh from backend to avoid stale IDs
    await fetchRescheduleExams();
    await fetchDaysWithExams();
  }

  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
