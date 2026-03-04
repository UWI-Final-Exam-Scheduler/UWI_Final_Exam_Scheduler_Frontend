"use client";

import React from "react";
import { Column as ColumnType, Exam } from "./calendarTypes";
import CustomCard from "./CustomCard";

type TimeColumnProps = {
  column: ColumnType;
  exams: Exam[];
};

export default function TimeColumn({ column, exams }: TimeColumnProps) {
  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 shadow-md/10">
      <h2 className="text-lg font-semibold">{column.title}</h2>
      <div className="flex flex-col gap-3 p-4">
        {exams.map((exam) => (
          <CustomCard key={exam.id}>{exam.courseCode}</CustomCard>
        ))}
      </div>
    </div>
  );
}
