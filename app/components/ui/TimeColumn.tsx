"use client";

import React from "react";
import { Column as ColumnType, Exam } from "./calendarTypes";
import ExamCardDnD from "./ExamCardDnD";
import { useDroppable } from "@dnd-kit/core";

type TimeColumnProps = {
  column: ColumnType;
  exams: Exam[];
};

export default function TimeColumn({ column, exams }: TimeColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });
  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 shadow-md/10">
      <h2 className="text-lg font-semibold">{column.title}</h2>
      <div ref={setNodeRef} className="flex flex-col gap-3 p-4">
        {exams.map((exam) => (
          <ExamCardDnD key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}
