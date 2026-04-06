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
  wouldExceedCapacity: (
    venueId: number,
    timeColId: string,
    students: number,
  ) => boolean,
  occupancyMap: Record<number, Record<string, number>>,
) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const [capacityWarningOpen, setCapacityWarningOpen] = useState(false);
  const [capacityWarningInfo, setCapacityWarningInfo] =
    useState<CapacityWarningInfo | null>(null);
  const [splitConflictOpen, setSplitConflictOpen] = useState(false);
  const [splitConflictInfo, setSplitConflictInfo] = useState<{
    courseCode: string;
    existingTime: number;
    existingDate: string;
  } | null>(null);

  function handleDismissCapacityWarning() {
    setCapacityWarningOpen(false);
    setCapacityWarningInfo(null);
  }
  function handleDismissSplitConflict() {
    setSplitConflictOpen(false);
    setSplitConflictInfo(null);
  }

  // ================================
  // 🔍 HELPER: Check if move violates split constraints
  // ================================
  // Line 65 (INSERT BEFORE handleExamDrag)
  function checkSplitConflict(
    exam: Exam,
    newTimeColumnId: string,
    newDateStr: string | null,
    allExams: Exam[],
  ): { hasConflict: boolean; conflictingExam?: Exam } {
    // Find ALL splits for this course (both calendar and reschedule)
    const sameCourseExams = allExams.filter(
      (e) => e.courseCode === exam.courseCode,
    );

    // If only 1, no conflict possible
    if (sameCourseExams.length <= 1) {
      return { hasConflict: false };
    }

    // Get OTHER splits (not the one being moved)
    const otherSplits = sameCourseExams.filter(
      (e) => String(e.id) !== String(exam.id),
    );

    // Check each split to see if it conflicts
    for (const split of otherSplits) {
      // Skip if this split is in reschedule column (will be merged later)
      if (split.timeColumnId === "0") {
        continue;
      }

      // If trying to move to reschedule, no conflict (merge happens after)
      if (newTimeColumnId === "0") {
        continue;
      }

      // Both are being scheduled - must match date AND time
      const moveToTime = Number(newTimeColumnId);
      const moveToDate = newDateStr;

      if (split.time !== moveToTime || split.exam_date !== moveToDate) {
        // CONFLICT! One split tries different time/date than another
        return {
          hasConflict: true,
          conflictingExam: split,
        };
      }
    }

    return { hasConflict: false };
  }

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

    // ================================
    // 🚨 1. CAPACITY CHECK
    // ================================
    if (newVenueId !== null && toColumn.id !== "0") {
      if (
        wouldExceedCapacity(
          newVenueId,
          newTimeColumnId,
          exam.number_of_students,
        )
      ) {
        const venue = venues.find((v) => v.id === newVenueId);

        setCapacityWarningInfo({
          courseCode: exam.courseCode,
          venueName: venue?.name ?? String(newVenueId),
          occupied: occupancyMap[newVenueId]?.[newTimeColumnId] ?? 0,
          capacity: venue?.capacity ?? 0,
          incomingStudents: exam.number_of_students,
        });

        setCapacityWarningOpen(true);
        return; // ❗ STOP HERE
      }
    }

    // ================================
    // 🚨 2. SPLIT CONFLICT CHECK
    // ================================
    // ================================
    // 🚨 2. SPLIT CONFLICT CHECK (comes BEFORE capacity check)
    // ================================
    // Line 114-155 (REPLACE THIS ENTIRE SECTION)

    // Build the new date string to check against
    const newDateStr =
      newTimeColumnId !== "0" && selectedDateRef.current
        ? `${selectedDateRef.current.getFullYear()}-${String(
            selectedDateRef.current.getMonth() + 1,
          ).padStart(2, "0")}-${String(
            selectedDateRef.current.getDate(),
          ).padStart(2, "0")}`
        : null;

    // Check if this move violates split constraints
    const splitCheck = checkSplitConflict(exam, newTimeColumnId, newDateStr, [
      ...exams,
      ...rescheduleExams,
    ]);

    if (splitCheck.hasConflict && splitCheck.conflictingExam) {
      // Show warning dialog
      setSplitConflictInfo({
        courseCode: exam.courseCode,
        existingTime: splitCheck.conflictingExam.time,
        existingDate: splitCheck.conflictingExam.exam_date,
      });
      setSplitConflictOpen(true);
      return; // ❗ STOP HERE - don't proceed
    }

    // ================================
    // ✅ 3. SAFE → proceed
    // ================================
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
      await moveActions.handleMoveFromReschedule(
        pendingMove,
        currentDate,
        rescheduleExams,
      );
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
    capacityWarningOpen,
    capacityWarningInfo,
    handleDismissCapacityWarning,
    splitConflictOpen,
    splitConflictInfo,
    handleDismissSplitConflict,
  };
}
