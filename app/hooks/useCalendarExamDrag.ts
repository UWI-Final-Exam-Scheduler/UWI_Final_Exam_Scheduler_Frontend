import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import {
  CalendarMoveActions,
  Exam,
  PendingMove,
  Venue,
} from "../components/types/calendarTypes";
import { ALL_COLUMNS } from "../components/constants/columns";

function parseDroppableId(id: string): {
  timeColumnId: string;
  venueId: number | null;
} {
  const parts = id.split("-");
  if (parts.length === 2) {
    return { timeColumnId: parts[0], venueId: Number(parts[1]) };
  }
  return { timeColumnId: id, venueId: null };
}

export function useCalendarExamDrag(
  exams: Exam[],
  rescheduleExams: Exam[],
  selectedDateRef: React.RefObject<Date | undefined>,
  fetchDaysWithExams: () => Promise<void>,
  moveActions: CalendarMoveActions,
  venues: Venue[],
) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  function handleExamDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const examId = active.id as string;
    const { timeColumnId: newTimeColumnId, venueId: newVenueId } =
      parseDroppableId(over.id as string);

    const exam =
      exams.find((e) => String(e.id) === examId) ??
      rescheduleExams.find((e) => String(e.id) === examId);

    if (!exam) return;

    const sameTime = exam.timeColumnId === newTimeColumnId;
    const sameVenue = newVenueId === null || exam.venue_id === newVenueId;
    if (sameTime && sameVenue) return;

    const fromColumn = ALL_COLUMNS.find((c) => c.id === exam.timeColumnId);

    const toColumn = ALL_COLUMNS.find((c) => c.id === newTimeColumnId);

    if (!fromColumn || !toColumn) return;

    // // this is to ensure when moving from reschedule to calendar, a venue must be selected
    // const isMovingFromReschedule = fromColumn.id === "0";
    // if (isMovingFromReschedule && newVenueId === null) return;

    const toVenueName =
      newVenueId !== null
        ? (venues.find((v) => v.id === newVenueId)?.name ?? String(newVenueId))
        : "";

    const toLabel =
      toColumn.id === "0"
        ? toColumn.title
        : toVenueName
          ? `${toColumn.title} — ${toVenueName}`
          : toColumn.title;

    setPendingMove({
      examId,
      exam,
      fromColumnId: fromColumn.id,
      toColumnId: toColumn.id,
      from: fromColumn.title,
      to: toLabel,
      toVenueId: toColumn.id === "0" ? undefined : (newVenueId ?? undefined),
    });

    setAlertOpen(true);
  }

  async function handleConfirmMove() {
    if (!pendingMove) return;

    const isMovingToReschedule = pendingMove.toColumnId === "0";

    const isMovingFromReschedule = pendingMove.fromColumnId === "0";

    const currentDate = selectedDateRef.current;

    if (isMovingToReschedule) {
      await moveActions.handleMoveToReschedule(pendingMove);
    } else if (isMovingFromReschedule && currentDate) {
      await moveActions.handleMoveFromReschedule(pendingMove, currentDate);
    } else {
      await moveActions.handleSameDayTimeChange(pendingMove);
    }

    await fetchDaysWithExams();

    setPendingMove(null);
    setAlertOpen(false);
  }

  function handleCancelMove() {
    setPendingMove(null);
    setAlertOpen(false);
  }

  return {
    alertOpen,
    pendingMove,
    handleExamDrag,
    handleConfirmMove,
    handleCancelMove,
  };
}
