import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import {
  CalendarMoveActions,
  Exam,
  PendingMove,
  Venue,
} from "../components/types/calendarTypes";
import { ALL_COLUMNS } from "../components/constants/columns";

type CapacityWarningInfo = {
  courseCode: string;
  venueName: string;
  occupied: number;
  capacity: number;
  incomingStudents: number;
};

type SplitConflictInfo = {
  courseCode: string;
  existingTime: number;
  existingDate: string;
};

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
  allScheduledExams: Exam[],
  selectedDateRef: React.RefObject<Date | undefined>,
  fetchDaysWithExams: () => Promise<void>,
  moveActions: CalendarMoveActions,
  venues: Venue[],
  wouldExceedCapacity: (
    venueId: number,
    timeColId: string,
    students: number,
  ) => boolean,
  occupancyMap: Record<number, Record<string, number>>,
) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [movingZoneIds, setMovingZoneIds] = useState<string[]>([]);

  const [capacityWarningOpen, setCapacityWarningOpen] = useState(false);
  const [capacityWarningInfo, setCapacityWarningInfo] =
    useState<CapacityWarningInfo | null>(null);
  const [splitConflictOpen, setSplitConflictOpen] = useState(false);
  const [splitConflictInfo, setSplitConflictInfo] =
    useState<SplitConflictInfo | null>(null);

  function handleDismissCapacityWarning() {
    setCapacityWarningOpen(false);
    setCapacityWarningInfo(null);
  }

  function handleDismissSplitConflict() {
    setSplitConflictOpen(false);
    setSplitConflictInfo(null);
  }

  function handleExamDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedExam = active.data.current?.exam as Exam | undefined;
    const activeId = String(active.id);
    const rawExamId = activeId.includes("::")
      ? activeId.split("::")[1]
      : activeId;

    const examId = rawExamId;
    const { timeColumnId: newTimeColumnId, venueId: newVenueId } =
      parseDroppableId(over.id as string);

    const exam =
      draggedExam ??
      exams.find((e) => String(e.id) === examId) ??
      rescheduleExams.find((e) => String(e.id) === examId);

    if (!exam) return;

    const sameTime = exam.timeColumnId === newTimeColumnId;
    const sameVenue = newVenueId === null || exam.venue_id === newVenueId;
    if (sameTime && sameVenue) return;

    const fromColumn = ALL_COLUMNS.find((c) => c.id === exam.timeColumnId);

    const toColumn = ALL_COLUMNS.find((c) => c.id === newTimeColumnId);

    if (!fromColumn || !toColumn) return;

    const targetDateStr =
      newTimeColumnId !== "0" && selectedDateRef.current
        ? `${selectedDateRef.current.getFullYear()}-${String(
            selectedDateRef.current.getMonth() + 1,
          ).padStart(2, "0")}-${String(
            selectedDateRef.current.getDate(),
          ).padStart(2, "0")}`
        : null;
    const targetTime = newTimeColumnId !== "0" ? Number(newTimeColumnId) : null;

    // All scheduled splits of the same course must share one exact date+time slot.
    if (newTimeColumnId !== "0") {
      const normalize = (code: string) => code.trim().toUpperCase();

      const scheduledById = new Map<number, Exam>();
      [...allScheduledExams, ...exams].forEach((e) => {
        if (e.id && e.exam_date) scheduledById.set(e.id, e);
      });

      const otherScheduledSplits = Array.from(scheduledById.values()).filter(
        (e) =>
          normalize(e.courseCode) === normalize(exam.courseCode) &&
          String(e.id) !== String(exam.id),
      );

      if (otherScheduledSplits.length > 0) {
        const targetKey = `${targetDateStr}|${targetTime}`;

        // Distinct scheduled slots already used by sibling splits
        const existingKeys = new Set(
          otherScheduledSplits.map((e) => `${e.exam_date}|${Number(e.time)}`),
        );

        // Must match exactly one of the already-scheduled split slots
        if (!existingKeys.has(targetKey)) {
          const first = otherScheduledSplits[0];
          setSplitConflictInfo({
            courseCode: exam.courseCode,
            existingTime: Number(first.time),
            existingDate: first.exam_date,
          });
          setSplitConflictOpen(true);
          return;
        }
      }
    }

    // this is to ensure when moving from reschedule to calendar, a venue must be selected

    if (newVenueId !== null && toColumn.id !== "0") {
      // At drag-validation time, only enforce capacity for the moved split itself.
      // Auto-merge capacity is evaluated later in move handlers.
      const studentsForCapacityCheck = exam.number_of_students;

      if (
        wouldExceedCapacity(
          newVenueId,
          newTimeColumnId,
          studentsForCapacityCheck,
        )
      ) {
        const venue = venues.find((v) => v.id === newVenueId);
        setCapacityWarningInfo({
          courseCode: exam.courseCode,
          venueName: venue?.name ?? String(newVenueId),
          occupied: occupancyMap[newVenueId]?.[newTimeColumnId] ?? 0,
          capacity: venue?.capacity ?? 0,
          incomingStudents: studentsForCapacityCheck,
        });
        setCapacityWarningOpen(true);
        return;
      }
    }

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
      examId: String(exam.id),
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

    const fromZoneId =
      pendingMove.fromColumnId === "0"
        ? "0"
        : `${pendingMove.fromColumnId}-${pendingMove.exam.venue_id}`;

    const toZoneId =
      pendingMove.toColumnId === "0"
        ? "0"
        : `${pendingMove.toColumnId}-${pendingMove.toVenueId}`;

    setMovingZoneIds([fromZoneId, toZoneId]);

    try {
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
    } finally {
      setMovingZoneIds([]);
      setPendingMove(null);
      setAlertOpen(false);
    }
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
    capacityWarningOpen,
    capacityWarningInfo,
    handleDismissCapacityWarning,
    splitConflictOpen,
    splitConflictInfo,
    handleDismissSplitConflict,
    movingZoneIds,
  };
}
