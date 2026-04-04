import { ALL_COLUMNS } from "../components/constants/columns";
import { useCalendarExamFetch } from "./useCalendarExamFetch";
import { useCalendarMove } from "./useCalendarMove";
import { useCalendarExamDrag } from "./useCalendarExamDrag";
import { useExamSplitMerge } from "./useExamSplitMerge";

export function useRefineCalendar(date: Date | undefined) {
  const fetchState = useCalendarExamFetch(date);

  const moveActions = useCalendarMove(
    fetchState.exams,
    fetchState.setExams,
    fetchState.setRescheduleExams,
  );

  const dragState = useCalendarExamDrag(
    fetchState.exams,
    fetchState.rescheduleExams,
    fetchState.selectedDateRef,
    fetchState.fetchDaysWithExams,
    moveActions,
    fetchState.venues,
  );

  const splitMerge = useExamSplitMerge(fetchState.exams, fetchState.setExams);

  return {
    ...fetchState,
    ...dragState,
    ...splitMerge,
    columns: ALL_COLUMNS,
  };
}
