"use client";

import TimeColumn from "./TimeColumn";
import ScheduleAlert from "./ScheduleAlert";
import { ExamDisplayerProps } from "../types/calendarTypes";
import { useColumns } from "@/app/hooks/useColumns";
import { Column } from "../types/calendarTypes";

export default function ExamDisplayer({
  selectedDay,
  exams,
  alertOpen,
  pendingMove,
  handleConfirmMove,
  handleCancelMove,
}: ExamDisplayerProps) {
  const columns = useColumns();

  const timeColumns = columns.filter((col) => col.id !== "0");

  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-4">
        Exams on {selectedDay.toLocaleDateString()}
      </h1>
      {pendingMove && (
        <ScheduleAlert
          open={alertOpen}
          title="Confirm Exam Move"
          message={`Move ${pendingMove.exam.courseCode} from ${pendingMove.from} to ${pendingMove.to}?`}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4">
          {timeColumns.map((timecolumn) => (
            <TimeColumn
              key={timecolumn.id}
              column={timecolumn}
              exams={exams.filter(
                (exam) => exam.timeColumnId === timecolumn.id,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
