import { useState } from "react";
import { Column, Exam, PendingMove } from "../components/types/calendarTypes";
import { DragEndEvent } from "@dnd-kit/core";

const TIMECOLUMNS: Column[] = [
  { id: "9", title: "9:00 AM" },
  { id: "1", title: "1:00 PM" },
  { id: "4", title: "4:00 PM" },
];

const EXAMS: Exam[] = [
  { id: "1", courseCode: "CSC101", timeColumnId: "9" },
  { id: "2", courseCode: "MAT202", timeColumnId: "1" },
  { id: "3", courseCode: "PHY303", timeColumnId: "4" },
  { id: "4", courseCode: "ENG404", timeColumnId: "9" },
];

export function useRefineCalendar() {
  const [exams, setExams] = useState<Exam[]>(EXAMS);
  const [columns] = useState<Column[]>(TIMECOLUMNS);
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  function handleExamDrag(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const examId = active.id as string;
    const newTimeColumnId = over.id as Exam["timeColumnId"];

    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    if (exam.timeColumnId === newTimeColumnId) return; // No change

    const fromColumn = columns.find((col) => col.id === exam.timeColumnId);
    const toColumn = columns.find((col) => col.id === newTimeColumnId);
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

  function handleConfirmMove() {
    if (!pendingMove) return;

    setExams(() =>
      exams.map((exam) =>
        exam.id === pendingMove.examId
          ? {
              ...exam,
              timeColumnId: pendingMove.toColumnId,
            }
          : exam,
      ),
    );
    setPendingMove(null);
    setAlertOpen(false);
  }

  function handleCancelMove() {
    setPendingMove(null);
    setAlertOpen(false);
  }

  return {
    exams,
    columns,
    alertOpen,
    pendingMove,
    handleExamDrag,
    handleConfirmMove,
    handleCancelMove,
  };
}
