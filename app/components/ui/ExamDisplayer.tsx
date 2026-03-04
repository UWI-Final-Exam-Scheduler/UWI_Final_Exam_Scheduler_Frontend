"use client";

import TimeColumn from "./TimeColumn";
import { useState } from "react";
import { Column, Exam } from "./calendarTypes";
import { DndContext, DragEndEvent } from "@dnd-kit/core";

type ExamDisplayerProps = {
  selectedDay: Date;
};

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

export default function ExamDisplayer({ selectedDay }: ExamDisplayerProps) {
  const [exams, setExams] = useState<Exam[]>(EXAMS);
  const [columns, setColumns] = useState<Column[]>(TIMECOLUMNS);

  function handleExamDrag(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const examId = active.id as string;
    const newTimeColumnId = over.id as Exam["timeColumnId"];

    setExams(() =>
      exams.map((exam) =>
        exam.id === examId
          ? {
              ...exam,
              timeColumnId: newTimeColumnId,
            }
          : exam,
      ),
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-4">
        Exams on {selectedDay.toLocaleDateString()}
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4">
        <DndContext onDragEnd={handleExamDrag}>
          {TIMECOLUMNS.map((timecolumn) => (
            <TimeColumn
              key={timecolumn.id}
              column={timecolumn}
              exams={exams.filter(
                (exam) => exam.timeColumnId === timecolumn.id,
              )}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
