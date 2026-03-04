"use client";

import TimeColumn from "./TimeColumn";
import { useState } from "react";
import { Column, Exam } from "./calendarTypes";

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
  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-4">
        Exams on {selectedDay.toLocaleDateString()}
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4">
        {TIMECOLUMNS.map((timecolumn) => (
          <TimeColumn
            key={timecolumn.id}
            column={timecolumn}
            exams={exams.filter((exam) => exam.timeColumnId === timecolumn.id)}
          />
        ))}
      </div>
    </div>
  );
}
