"use client";
import { DayPicker } from "react-day-picker";
import { useState } from "react";
import "react-day-picker/style.css";
import ExamDisplayer from "./ExamDisplayer";
import { Box, Spinner } from "@radix-ui/themes";
import CustomButton from "./CustomButton";
import TimeColumn from "./TimeColumn";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useRefineCalendar } from "@/app/hooks/useRefineCalendar";
import { useAdjacentDayExams } from "@/app/hooks/useAdjacentDayExams";
import { useExamClashColors } from "@/app/hooks/useExamClashColors";
import CapacityWarningDialog from "./CapacityWarningDialog";
import SplitConflictDialog from "./SplitConflictDialog";
import MergeExamDialog from "./MergeExamDialog";
import SplitExamDialog from "./SplitExamDialog";
import { Exam } from "../types/calendarTypes";

type CalendarProps = {
  startMonth?: Date;
  endMonth?: Date;
};

export default function CalendarDayPicker({
  startMonth,
  endMonth,
}: CalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [isSelected, setIsSelected] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeDragExam, setActiveDragExam] = useState<Exam | null>(null);

  const {
    exams,
    haveExamsDay,
    rescheduleExams,
    venues,
    columns,
    alertOpen,
    pendingMove,
    handleExamDrag,
    handleConfirmMove,
    handleCancelMove,
    isLoading,
    isInitialLoading,
    activeExam,
    examSplits,
    splitDialogOpen,
    mergeDialogOpen,
    onSplit,
    onMerge,
    onSplitConfirm,
    onMergeConfirm,
    onCloseSplit,
    onCloseMerge,
    capacityWarningOpen,
    capacityWarningInfo,
    handleDismissCapacityWarning,
    rescheduleActiveExam,
    rescheduleExamSplits,
    rescheduleSplitDialogOpen,
    rescheduleMergeDialogOpen,
    onRescheduleExamSplit,
    onRescheduleExamMerge,
    onRescheduleExamSplitConfirm,
    onRescheduleExamMergeConfirm,
    onCloseRescheduleSplit,
    onCloseRescheduleMerge,
    splitConflictOpen,
    splitConflictInfo,
    handleDismissSplitConflict,
    allScheduledExams, // ← ADD THIS LINE
  } = useRefineCalendar(selected);

  // Fetch exams on day before and day after selected date
  const { prevDayExams, nextDayExams } = useAdjacentDayExams(selected); // new

  const { colorMap, clashExamsMap } = useExamClashColors(
    exams,
    prevDayExams,
    nextDayExams,
  );

  const rescheduleColumn = columns.find((col) => col.id === "0");

  const handleDaySelect = (selectedDay: Date | undefined) => {
    setSelected(selectedDay);
    setIsSelected(true);
    setIsCollapsed(true);
    setHasInteracted(true);
  };

  const selectAnotherDay = () => {
    setIsSelected(false);
    setIsCollapsed(false);
    setSelected(undefined);
  };

  // added these to avoid layering issue when dragging an exam so it can be above the reschedule column
  const handleDragStart = (event: DragStartEvent) => {
    const exam = event.active.data.current?.exam as Exam | undefined;
    setActiveDragExam(exam ?? null);
  };

  const handleDragEndWithOverlay = (event: DragEndEvent) => {
    handleExamDrag(event);
    setActiveDragExam(null);
  };

  const handleDragCancel = () => {
    setActiveDragExam(null);
  };

  const splitContextExams = (() => {
    const combined = [...(allScheduledExams ?? []), ...(rescheduleExams ?? [])];
    const seen = new Set<number>();
    return combined.filter((exam) => {
      if (seen.has(exam.id)) return false;
      seen.add(exam.id);
      return true;
    });
  })();

  // Determine splits for the currently dragged exam
  const activeCourseSplits = activeDragExam
    ? splitContextExams
        .filter((e) => e.courseCode === activeDragExam.courseCode)
        .sort((a, b) => a.id - b.id)
    : [];

  const activeSplitIndex = activeDragExam
    ? activeCourseSplits.findIndex((e) => e.id === activeDragExam.id) + 1
    : 0;
  const activeSplitTotal = activeCourseSplits.length;

  // Determine month range to render the correct months
  const resolvedStartMonth =
    haveExamsDay.length > 0
      ? new Date(Math.min(...haveExamsDay.map((d) => d.getTime())))
      : (startMonth ?? new Date());

  const resolvedEndMonth =
    haveExamsDay.length > 0
      ? new Date(Math.max(...haveExamsDay.map((d) => d.getTime())))
      : (endMonth ?? startMonth ?? new Date());

  const startMonthBound = new Date(
    resolvedStartMonth.getFullYear(),
    resolvedStartMonth.getMonth(),
    1,
  );

  const endMonthBound = new Date(
    resolvedEndMonth.getFullYear(),
    resolvedEndMonth.getMonth(),
    1,
  );

  const monthRangeKey = `${startMonthBound.getFullYear()}-${startMonthBound.getMonth()}_${endMonthBound.getFullYear()}-${endMonthBound.getMonth()}_${haveExamsDay.length}`;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWithOverlay}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 p-4">
        {capacityWarningInfo && (
          <CapacityWarningDialog
            open={capacityWarningOpen}
            courseCode={capacityWarningInfo.courseCode}
            venueName={capacityWarningInfo.venueName}
            occupied={capacityWarningInfo.occupied}
            capacity={capacityWarningInfo.capacity}
            incomingStudents={capacityWarningInfo.incomingStudents}
            onDismiss={handleDismissCapacityWarning}
          />
        )}
        <SplitConflictDialog
          open={splitConflictOpen}
          courseCode={splitConflictInfo?.courseCode ?? ""}
          existingTime={splitConflictInfo?.existingTime}
          existingDate={splitConflictInfo?.existingDate}
          onDismiss={handleDismissSplitConflict}
        />
        <Box className="flex-1" style={{ transition: "all 0.3s ease" }}>
          {!isSelected && !isCollapsed && (
            <div className={hasInteracted ? "motion-preset-slide-down" : ""}>
              {isInitialLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Spinner />
                </div>
              ) : (
                <DayPicker
                  key={monthRangeKey}
                  mode="single"
                  numberOfMonths={2}
                  defaultMonth={startMonthBound}
                  selected={selected}
                  onSelect={handleDaySelect}
                  startMonth={startMonthBound}
                  endMonth={endMonthBound}
                  modifiers={{ hasExam: haveExamsDay }}
                  modifiersStyles={{
                    hasExam: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                      color: "#3b82f6",
                    },
                  }}
                  style={
                    {
                      "--rdp-accent-color": "#3b82f6",
                      "--rdp-day-width": "70px",
                      "--rdp-day-height": "70px",
                      "--rdp-month-caption-font-size": "1.25rem",
                      "--rdp-weekday-font-size": "1rem",
                    } as React.CSSProperties
                  }
                />
              )}
            </div>
          )}

          {isSelected && selected && isCollapsed && (
            <div className="motion-preset-slide-up">
              <CustomButton
                buttonname="Select Another Day"
                onclick={selectAnotherDay}
              />
              <ExamDisplayer
                selectedDay={selected}
                exams={exams}
                columns={columns}
                venues={venues}
                alertOpen={alertOpen}
                pendingMove={pendingMove}
                isLoading={isLoading}
                handleConfirmMove={handleConfirmMove}
                handleCancelMove={handleCancelMove}
                activeExam={activeExam}
                examSplits={examSplits}
                splitDialogOpen={splitDialogOpen}
                mergeDialogOpen={mergeDialogOpen}
                onSplitExam={onSplit}
                onMergeExam={onMerge}
                onSplitConfirm={onSplitConfirm}
                onMergeConfirm={onMergeConfirm}
                onCloseSplit={onCloseSplit}
                onCloseMerge={onCloseMerge}
                clashColorMap={colorMap} //
                clashExamsMap={clashExamsMap}
                rescheduleExams={rescheduleExams ?? []}
              />
            </div>
          )}
        </Box>

        {rescheduleColumn && (
          <aside className="w-48 shrink-0 sticky top-4 self-start">
            {isInitialLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <Spinner className="mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Loading Reschedule Column...
                  </p>
                </div>
              </div>
            ) : (
              <TimeColumn
                column={rescheduleColumn}
                exams={rescheduleExams ?? []}
                allExams={(() => {
                  const combined = [
                    ...(allScheduledExams ?? []),
                    ...(rescheduleExams ?? []),
                  ];
                  const seen = new Set<number>();
                  return combined.filter((exam) => {
                    if (seen.has(exam.id)) return false;
                    seen.add(exam.id);
                    return true;
                  });
                })()}
                isLoading={isLoading}
                onSplitExam={onRescheduleExamSplit}
                onMergeExam={onRescheduleExamMerge}
                clashColorMap={colorMap}
                clashExamsMap={clashExamsMap}
              />
            )}
          </aside>
        )}

        <SplitExamDialog
          key={
            rescheduleActiveExam?.id != null
              ? `split-reschedule-${rescheduleActiveExam.id}`
              : undefined
          }
          exam={rescheduleActiveExam}
          open={rescheduleSplitDialogOpen}
          onConfirm={onRescheduleExamSplitConfirm}
          onCancel={onCloseRescheduleSplit}
          existingSplitCount={
            rescheduleExams?.filter(
              (e) => e.courseCode === rescheduleActiveExam?.courseCode,
            ).length
          }
        />
        <MergeExamDialog
          key={
            rescheduleActiveExam?.id != null
              ? `merge-reschedule-${rescheduleActiveExam.id}`
              : "reschedule-merge-closed"
          }
          exam={rescheduleActiveExam}
          splits={rescheduleExamSplits}
          open={rescheduleMergeDialogOpen}
          onConfirm={onRescheduleExamMergeConfirm}
          onCancel={onCloseRescheduleMerge}
          venues={venues}
        />
      </div>
      <DragOverlay zIndex={9999}>
        {activeDragExam ? (
          <div className="pointer-events-none">
            <div className="h-7 min-w-28 rounded-md border border-gray-300 bg-white px-2 shadow-lg flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <span className="text-xs font-bold truncate">
                  {activeDragExam.courseCode}
                </span>
                {activeSplitTotal > 1 && activeSplitIndex > 0 && (
                  <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">
                    Split:{activeSplitIndex}/{activeSplitTotal}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium shrink-0">
                {activeDragExam.number_of_students}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
