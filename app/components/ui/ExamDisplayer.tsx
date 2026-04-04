"use client";

import TimeColumn from "./TimeColumn";
import ScheduleAlert from "./ScheduleAlert";
import { ExamDisplayerProps } from "../types/calendarTypes";
import MergeExamDialog from "./MergeExamDialog";
import SplitExamDialog from "./SplitExamDialog";

export default function ExamDisplayer({
  selectedDay,
  exams,
  columns,
  venues,
  alertOpen,
  pendingMove,
  isLoading,
  handleConfirmMove,
  handleCancelMove,
  onSplitExam,
  onMergeExam,
  splitDialogOpen,
  mergeDialogOpen,
  activeExam,
  examSplits,
  onSplitConfirm,
  onMergeConfirm,
  onCloseSplit,
  onCloseMerge,
}: ExamDisplayerProps) {
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
          message={
            pendingMove.toColumnId === "0" &&
            exams.filter((e) => e.courseCode === pendingMove.exam.courseCode)
              .length > 1
              ? `Move ${pendingMove.exam.courseCode} from ${pendingMove.from} to ${pendingMove.to}? This exam has multiple splits — all splits will be collapsed into one.`
              : `Move ${pendingMove.exam.courseCode} from ${pendingMove.from} to ${pendingMove.to}?`
          }
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
      <SplitExamDialog
        key={activeExam?.courseCode}
        exam={activeExam}
        open={splitDialogOpen}
        onConfirm={onSplitConfirm}
        onCancel={onCloseSplit}
      />

      <MergeExamDialog
        key={activeExam?.courseCode}
        exam={activeExam}
        splits={examSplits}
        open={mergeDialogOpen}
        onConfirm={onMergeConfirm}
        onCancel={onCloseMerge}
      />
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4">
          {timeColumns.map((timecolumn) => (
            <TimeColumn
              key={timecolumn.id}
              column={timecolumn}
              venues={venues}
              isLoading={isLoading}
              allExams={exams}
              onSplitExam={onSplitExam}
              onMergeExam={onMergeExam}
              exams={(exams ?? []).filter(
                (exam) => exam.timeColumnId === timecolumn.id,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
