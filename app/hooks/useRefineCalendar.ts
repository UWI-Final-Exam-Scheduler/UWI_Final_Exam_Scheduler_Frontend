import { ALL_COLUMNS } from "../components/constants/columns";
import { useCalendarExamFetch } from "./useCalendarExamFetch";
import { useCalendarMove } from "./useCalendarMove";
import { useCalendarExamDrag } from "./useCalendarExamDrag";

export function useRefineCalendar(date: Date | undefined) {
  const fetchState = useCalendarExamFetch(date);

  const moveActions = useCalendarMove(
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

  return {
    ...fetchState,
    ...dragState,
    columns: ALL_COLUMNS,
  };
}
