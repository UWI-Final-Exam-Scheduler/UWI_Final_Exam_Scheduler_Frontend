"use client";

import TimeColumn from "./TimeColumn";
import ScheduleAlert from "./ScheduleAlert";
import { ExamDisplayerProps } from "../types/calendarTypes";
import MergeExamDialog from "./MergeExamDialog";
import SplitExamDialog from "./SplitExamDialog";
import { IconButton } from "@radix-ui/themes";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ExamDisplayer({
  selectedDay,
  exams,
  rescheduleExams,
  columns,
  venues,
  alertOpen,
  pendingMove,
  isLoading,
  handleConfirmMove,
  handleCancelMove,
  onPreviousDay,
  onNextDay,
  disablePreviousDay,
  disableNextDay,
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
  clashColorMap,
  clashExamsMap,
  movingZoneIds,
}: ExamDisplayerProps) {
  const timeColumns = columns.filter((col) => col.id !== "0");

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-4">
        <IconButton
          variant="soft"
          color="gray"
          radius="full"
          size="3"
          onClick={onPreviousDay}
          disabled={disablePreviousDay}
          aria-label="Previous day"
          style={{ cursor: "pointer" }}
        >
          <ChevronLeft size={18} />
        </IconButton>

        <h1 className="text-center text-2xl font-bold text-gray-800">
          Exams on {selectedDay.toLocaleDateString()}
        </h1>

        <IconButton
          variant="soft"
          color="gray"
          radius="full"
          size="3"
          onClick={onNextDay}
          disabled={disableNextDay}
          aria-label="Next day"
          style={{ cursor: "pointer" }}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
      {pendingMove && (
        <ScheduleAlert
          open={alertOpen}
          title="Confirm Exam Move"
          message={`Move ${pendingMove.exam.courseCode} from ${pendingMove.from} to ${pendingMove.to}?`}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
      <SplitExamDialog
        key={activeExam?.id != null ? `split-${activeExam.id}` : undefined}
        exam={activeExam}
        open={splitDialogOpen}
        onConfirm={onSplitConfirm}
        onCancel={onCloseSplit}
        existingSplitCount={
          [...exams, ...rescheduleExams].filter(
            (e) =>
              e.courseCode === activeExam?.courseCode &&
              String(e.id) !== String(activeExam?.id),
          ).length
        }
      />

      <MergeExamDialog
        key={activeExam?.id != null ? `merge-${activeExam.id}` : "merge-closed"}
        exam={activeExam}
        splits={examSplits}
        open={mergeDialogOpen}
        onConfirm={onMergeConfirm}
        onCancel={onCloseMerge}
        venues={venues}
      />
      <div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {timeColumns.map((timecolumn) => (
              <TimeColumn
                key={timecolumn.id}
                column={timecolumn}
                venues={venues}
                isLoading={isLoading}
                allExams={[...(exams ?? []), ...(rescheduleExams ?? [])]}
                onSplitExam={onSplitExam}
                onMergeExam={onMergeExam}
                exams={(exams ?? []).filter(
                  (exam) => exam.timeColumnId === timecolumn.id,
                )}
                clashColorMap={clashColorMap} //
                clashExamsMap={clashExamsMap} // pass down clash details for hover cards
                movingZoneIds={movingZoneIds}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
