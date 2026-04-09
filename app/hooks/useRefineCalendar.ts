import { ALL_COLUMNS } from "../components/constants/columns";
import { useCalendarExamFetch } from "./useCalendarExamFetch";
import { useCalendarMove } from "./useCalendarMove";
import { useCalendarExamDrag } from "./useCalendarExamDrag";
import { useExamSplitMerge } from "./useExamSplitMerge";
import { useCapacityFlag } from "./useCapacityFlag";

export function useRefineCalendar(date: Date | undefined) {
  const fetchState = useCalendarExamFetch(date);
  const refreshAfterSplitMerge = async () => {
    await Promise.all([
      fetchState.fetchRescheduleExams(),
      fetchState.refreshSelectedDateExams(),
      fetchState.fetchDaysWithExams(),
    ]);
  };

  const moveActions = useCalendarMove(
    fetchState.venues,
    fetchState.fetchRescheduleExams,
    fetchState.fetchDaysWithExams,
  );
  const { occupancyMap, wouldExceedCapacity } = useCapacityFlag(
    fetchState.exams,
    fetchState.venues,
  );

  const dragState = useCalendarExamDrag(
    fetchState.exams,
    fetchState.rescheduleExams,
    fetchState.allScheduledExams,
    fetchState.selectedDateRef,
    fetchState.fetchDaysWithExams,
    moveActions,
    fetchState.venues,
    wouldExceedCapacity,
    occupancyMap,
  );

  const splitMerge = useExamSplitMerge(
    fetchState.exams,
    fetchState.setExams,
    fetchState.rescheduleExams,
    fetchState.setRescheduleExams,
    refreshAfterSplitMerge,
  );
  const rescheduleSplitMerge = useExamSplitMerge(
    fetchState.rescheduleExams,
    fetchState.setRescheduleExams,
    fetchState.rescheduleExams,
    fetchState.setRescheduleExams,
    refreshAfterSplitMerge,
  );

  const combinedMovingZoneIds = Array.from(
    new Set([
      ...(dragState.movingZoneIds ?? []),
      ...(splitMerge.updatingZoneIds ?? []),
      ...(rescheduleSplitMerge.updatingZoneIds ?? []),
    ]),
  );

  return {
    ...fetchState,
    ...dragState,
    ...splitMerge,
    rescheduleActiveExam: rescheduleSplitMerge.activeExam,
    rescheduleExamSplits: rescheduleSplitMerge.examSplits,
    rescheduleSplitDialogOpen: rescheduleSplitMerge.splitDialogOpen,
    rescheduleMergeDialogOpen: rescheduleSplitMerge.mergeDialogOpen,
    onRescheduleExamSplit: rescheduleSplitMerge.onSplit,
    onRescheduleExamMerge: rescheduleSplitMerge.onMerge,
    onRescheduleExamSplitConfirm: rescheduleSplitMerge.onSplitConfirm,
    onRescheduleExamMergeConfirm: rescheduleSplitMerge.onMergeConfirm,
    onCloseRescheduleSplit: rescheduleSplitMerge.onCloseSplit,
    onCloseRescheduleMerge: rescheduleSplitMerge.onCloseMerge,
    splitConflictOpen: dragState.splitConflictOpen,
    splitConflictInfo: dragState.splitConflictInfo,
    handleDismissSplitConflict: dragState.handleDismissSplitConflict,
    movingZoneIds: combinedMovingZoneIds,
    columns: ALL_COLUMNS,
  };
}
