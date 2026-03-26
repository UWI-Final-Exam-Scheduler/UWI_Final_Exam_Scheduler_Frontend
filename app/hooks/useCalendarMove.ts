import { Exam, PendingMove } from "../components/types/calendarTypes";
import { formatDatetoString, rescheduleExam } from "../lib/examFetch";
import { Dispatch, SetStateAction } from "react";

export function useCalendarMove(
  setExams: Dispatch<SetStateAction<Exam[]>>,
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
) {
  async function handleMoveToReschedule(move: PendingMove) {
    await rescheduleExam(move.exam.courseCode, 0, null, true);

    setExams((prev) => prev.filter((e) => String(e.id) !== move.examId));

    setRescheduleExams((prev) => [
      ...prev,
      { ...move.exam, timeColumnId: "0" },
    ]);
  }

  async function handleMoveFromReschedule(
    move: PendingMove,
    currentDate: Date,
  ) {
    const newDateStr = formatDatetoString(currentDate);

    await rescheduleExam(
      move.exam.courseCode,
      Number(move.toColumnId),
      newDateStr,
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
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    await rescheduleExam(move.exam.courseCode, Number(move.toColumnId));

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
  }

  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
