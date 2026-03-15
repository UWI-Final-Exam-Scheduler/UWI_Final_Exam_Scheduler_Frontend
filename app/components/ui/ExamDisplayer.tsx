"use client";

import TimeColumn from "./TimeColumn";
import { DndContext } from "@dnd-kit/core";
import ScheduleAlert from "./ScheduleAlert";
import { ExamDisplayerProps } from "../types/calendarTypes";
import { useRefineCalendar } from "@/app/hooks/useRefineCalendar";

export default function ExamDisplayer({ selectedDay }: ExamDisplayerProps) {
  const {
    exams,
    columns,
    alertOpen,
    pendingMove,
    handleExamDrag,
    handleConfirmMove,
    handleCancelMove,
  } = useRefineCalendar();

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4">
        <DndContext onDragEnd={handleExamDrag}>
          {}
          {columns.map((timecolumn) => (
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
