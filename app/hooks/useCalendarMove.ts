import { Exam, PendingMove } from "../components/types/calendarTypes";
import { formatDatetoString, rescheduleExam } from "../lib/examFetch";
import { Dispatch, SetStateAction } from "react";

export function useCalendarMove(
  exams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
) {
  async function handleMoveToReschedule(move: PendingMove) {
    await rescheduleExam(move.exam.courseCode, 0, null, true);

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
