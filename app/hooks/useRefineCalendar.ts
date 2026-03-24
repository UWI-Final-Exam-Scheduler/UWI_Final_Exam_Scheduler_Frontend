import { useEffect, useRef, useState } from "react";
import { Exam, PendingMove } from "../components/types/calendarTypes";
import {
  examFetchbyDate,
  fetchExamstobeRescheduled,
  rescheduleExam,
  formatDatetoString,
  get_days_with_exams,
} from "../lib/examFetch";
import { DragEndEvent } from "@dnd-kit/core";

import { ALL_COLUMNS } from "../components/constants/columns";

export function useRefineCalendar(date: Date | undefined) {
  const [rescheduleExams, setRescheduleExams] = useState<Exam[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const selectedDateRef = useRef<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [haveExamsDay, setHaveExamsDay] = useState<Date[]>([]);

  const fetchDaysWithExams = async () => {
    try {
      const days: string[] = await get_days_with_exams();
      setHaveExamsDay(days.map((d) => new Date(d + "T12:00:00")));
    } catch (error) {
      console.error("Error fetching days with exams:", error);
    }
  };

  useEffect(() => {
    fetchDaysWithExams();
  }, []);

  useEffect(() => {
    fetchExamstobeRescheduled()
      .then(setRescheduleExams)
      .catch((err) => {
        console.error("Failed to fetch reschedule exams:", err);
        setRescheduleExams([]);
      });
  }, []);

  useEffect(() => {
    selectedDateRef.current = date;
    if (!date) return;
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const data = await examFetchbyDate(formatDatetoString(date));
        setExams(
          data.map((exam: Exam) => ({
            ...exam,
            timeColumnId: String(exam.time),
          })),
        );
      } catch (err) {
        console.error("Failed to fetch exams:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, [date]);

  function handleExamDrag(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const examId = active.id as string;
    const newTimeColumnId = over.id as string;

    const exam =
      exams.find((e) => String(e.id) === examId) ??
      rescheduleExams.find((e) => String(e.id) === examId);

    if (!exam) return;
    if (exam.timeColumnId === newTimeColumnId) return; // No change

    const fromColumn = ALL_COLUMNS.find((col) => col.id === exam.timeColumnId);
    const toColumn = ALL_COLUMNS.find((col) => col.id === newTimeColumnId);
    if (!fromColumn || !toColumn) return;

    setPendingMove({
      examId,
      exam,
      fromColumnId: fromColumn.id,
      toColumnId: toColumn.id,
      from: fromColumn.title,
      to: toColumn.title,
    });
    setAlertOpen(true);
  }

  async function handleMoveToReschedule(move: PendingMove) {
    // this is when moving to the reschedule column and this sets the time and date to 0/null in the db
    await rescheduleExam(move.exam.courseCode, 0, null, true);
    setExams((prev) => prev.filter((e) => String(e.id) !== move.examId));
    setRescheduleExams((prev) => [
      ...prev,
      { ...move.exam, timeColumnId: "0" },
    ]);
  }

  async function handleMoveFromReschedule( // this is moving an exam from the reschedule column to a specific date and time, so we need to set the date and time in the db
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
      },
    ]);
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    //same day time change
    await rescheduleExam(move.exam.courseCode, Number(move.toColumnId));
    setExams((prev) =>
      prev.map((exam) =>
        String(exam.id) === move.examId
          ? {
              ...exam,
              time: Number(move.toColumnId),
              timeColumnId: move.toColumnId,
            }
          : exam,
      ),
    );
  }

  async function handleConfirmMove() {
    if (!pendingMove) return;

    const isMovingToReschedule = pendingMove.toColumnId === "0";
    const isMovingFromReschedule = pendingMove.fromColumnId === "0";
    const currentDate = selectedDateRef.current;

    try {
      if (isMovingToReschedule) {
        await handleMoveToReschedule(pendingMove);
      } else if (isMovingFromReschedule && currentDate) {
        await handleMoveFromReschedule(pendingMove, currentDate);
      } else {
        await handleSameDayTimeChange(pendingMove);
      }
    } catch (err) {
      console.error("Failed to complete move:", err);
    }

    await fetchDaysWithExams(); // Refresh the list of days with exams after any move
    setPendingMove(null);
    setAlertOpen(false);
  }

  function handleCancelMove() {
    setPendingMove(null);
    setAlertOpen(false);
  }

  return {
    exams,
    rescheduleExams,
    haveExamsDay,
    columns: ALL_COLUMNS,
    alertOpen,
    pendingMove,
    isLoading,
    handleExamDrag,
    handleConfirmMove,
    handleCancelMove,
  };
}
