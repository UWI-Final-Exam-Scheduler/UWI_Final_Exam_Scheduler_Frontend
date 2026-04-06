import { Exam, PendingMove } from "../components/types/calendarTypes";
import { formatDatetoString, rescheduleExam } from "../lib/examFetch";
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

    // Move this split to calendar
    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    // Simply remove moved exam from reschedule, do NOT auto-merge
    setRescheduleExams((prev: Exam[]) =>
      prev.filter((e: Exam) => String(e.id) !== move.examId),
    );

    // Add moved exam to calendar
    setExams((prev: Exam[]) => [
      ...prev,
      {
        ...move.exam,
        date: newDateStr,
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

    setExams((prev) =>
      prev.map((exam) =>
        String(exam.id) === move.examId
          ? {
              ...exam,
              time: Number(move.toColumnId),
              timeColumnId: move.toColumnId,
              venue_id: move.toVenueId ?? exam.venue_id,
            }
          : exam,
      ),
    );

    addLog({
      action: "Move Exam Same Day",
      entityId: move.exam.courseCode,
      oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
      newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
    });

    toast.success("Exam moved successfully");
  }
  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
