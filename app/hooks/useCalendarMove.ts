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
    const originalExam = exams.find((e) => String(e.id) === move.examId);

    await rescheduleExam(move.exam.id, 0, null, null, true);

    const courseCode = move.exam.courseCode;

    const splits = exams.filter((e) => e.courseCode === courseCode);
    const totalStudents = splits.reduce(
      (sum, s) => sum + s.number_of_students,
      0,
    );

    setExams((prev) =>
      prev.filter((e) => e.courseCode !== move.exam.courseCode),
    );
    setRescheduleExams((prev) => [
      ...prev,
      {
        ...move.exam,
        timeColumnId: "0",
        number_of_students: totalStudents,
        venue_id: 0,
      },
    ]);

    addLog({
      action: "Move Exam to Reschedule",
      entityId: courseCode,
      oldValue: `Time: ${originalExam?.timeColumnId}, Date: ${originalExam?.exam_date}, Venue: ${originalExam?.venue_id}`,
      newValue: "To Be Rescheduled",
    });

    toast.success("Exam moved to reschedule 📝");
  }

  async function handleMoveFromReschedule(
    move: PendingMove,
    currentDate: Date,
  ) {
    const newDateStr = formatDatetoString(currentDate);

    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    setRescheduleExams((prev) =>
      prev.filter((e) => String(e.id) !== move.examId),
    );

    setExams((prev) => [
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
      entityId: move.exam.courseCode,
      oldValue: "To Be Rescheduled",
      newValue: `Time: ${move.toColumnId}, Date: ${newDateStr}, Venue: ${move.toVenueId}`,
    });

    toast.success("Exam Rescheduled ✅");
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

    toast.success("Exam moved successfully ✅");
  }
  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
