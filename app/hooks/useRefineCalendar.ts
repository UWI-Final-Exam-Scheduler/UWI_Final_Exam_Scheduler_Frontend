import { ALL_COLUMNS } from "../components/constants/columns";
import { useCalendarExamFetch } from "./useCalendarExamFetch";
import { useCalendarMove } from "./useCalendarMove";
import { useCalendarExamDrag } from "./useCalendarExamDrag";
import { useExamSplitMerge } from "./useExamSplitMerge";
import { useCapacityFlag } from "./useCapacityFlag";

export function useRefineCalendar(date: Date | undefined) {
  const fetchState = useCalendarExamFetch(date);

  const moveActions = useCalendarMove(
    fetchState.exams,
    fetchState.setExams,
    fetchState.setRescheduleExams,
  );

  const { occupancyMap, wouldExceedCapacity } = useCapacityFlag(
    fetchState.exams,
    fetchState.venues,
  );

  const dragState = useCalendarExamDrag(
    fetchState.exams,
    fetchState.rescheduleExams,
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
    fetchState.fetchRescheduleExams,
  );
  const rescheduleSplitMerge = useExamSplitMerge(
    fetchState.rescheduleExams,
    fetchState.setRescheduleExams,
    fetchState.rescheduleExams,
    fetchState.setRescheduleExams,
    fetchState.fetchRescheduleExams,
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
    columns: ALL_COLUMNS,
  };
}
