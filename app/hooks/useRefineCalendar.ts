import { useState } from "react";
import { Column, Exam, PendingMove } from "../components/types/calendarTypes";
import { DragEndEvent } from "@dnd-kit/core";
import rawdata from "../testdata/exams.json";

const data = rawdata as { columns: Column[]; exams: Exam[] };

export function useRefineCalendar() {
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const storedExams = localStorage.getItem("exams");
      return storedExams ? JSON.parse(storedExams) : data.exams;
    } catch {
      return data.exams;
    }
  });
  const [columns] = useState<Column[]>(data.columns);
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

    // testing chnaging data in local storage
    const updated = exams.map((exam) =>
      exam.id === pendingMove.examId
        ? { ...exam, timeColumnId: pendingMove.toColumnId }
        : exam,
    );
    setExams(updated);
    localStorage.setItem("exams", JSON.stringify(updated));
    //

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
