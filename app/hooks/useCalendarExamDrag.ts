import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import {
  CalendarMoveActions,
  Exam,
  PendingMove,
  Venue,
} from "../components/types/calendarTypes";
import { ALL_COLUMNS } from "../components/constants/columns";
import { toast } from "react-hot-toast";
import { mergeExam } from "../lib/examFetch";

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

  async function autoMergeSameDayTimeSplits(exam: Exam, scheduledDate: string) {
    // Find all splits for this course
    const courseSplits = [...exams, ...rescheduleExams].filter(
      (e: Exam) => e.courseCode === exam.courseCode,
    );

    // If only 1 split or less, nothing to merge
    if (courseSplits.length <= 1) {
      return;
    }

    // Find splits scheduled on the SAME day, time, AND venue (not in reschedule)
    const splitsOnSameDayTime = courseSplits.filter(
      (e: Exam) =>
        e.timeColumnId !== "0" && // Not in reschedule
        e.exam_date === scheduledDate && // Same date
        e.time === exam.time && // Same time
        e.venue_id === exam.venue_id, // Same venue
    );

    // If 2 or more splits match, merge them
    if (splitsOnSameDayTime.length >= 2) {
      console.log(
        `Auto-merging ${splitsOnSameDayTime.length} splits of ${exam.courseCode}`,
      );

      const splitIds = splitsOnSameDayTime.map((e: Exam) => e.id);

      try {
        // mergeing api
        await mergeExam(splitIds);
        toast.success(
          `Auto-merged ${splitIds.length} splits of ${exam.courseCode}`,
        );
      } catch (error) {
        console.error("Auto-merge failed:", error);
        toast.error("Failed to auto-merge splits");
      }
    }
  }

  // Check if move violates split constraints
  function checkSplitConflict(
    exam: Exam,
    newTimeColumnId: string,
    newDateStr: string | null,
    allExams: Exam[],
  ): { hasConflict: boolean; conflictingExam?: Exam } {
    // Find ALL splits for this course
    const sameCourseExams = allExams.filter(
      (e: Exam) => e.courseCode === exam.courseCode,
    );

    // If only 1, no conflict possible
    if (sameCourseExams.length <= 1) {
      return { hasConflict: false };
    }

    // If trying to move TO reschedule, no conflict
    if (newTimeColumnId === "0") {
      return { hasConflict: false };
    }

    // Get OTHER splits (not the one being moved)
    const otherSplits = sameCourseExams.filter(
      (e: Exam) => String(e.id) !== String(exam.id),
    );

    // Check each other split
    for (const split of otherSplits) {
      // Skip if this split is in reschedule (not scheduled yet)
      if (split.timeColumnId === "0") {
        continue;
      }

      //compare the target location
      const moveToTime = Number(newTimeColumnId);
      const moveToDate = newDateStr;
      const splitTime = split.time;
      const splitDate = split.exam_date;

      // ONLY conflict if trying to move to DIFFERENT day/time
      // If SAME day/time/venue, they should MERGE (not conflict)
      if (splitDate !== moveToDate || splitTime !== moveToTime) {
        //DIFFERENT day or time = CONFLICT!
        console.log("SPLIT CONFLICT: Different day/time detected", {
          // debugging here
          courseCode: exam.courseCode,
          targetDate: moveToDate,
          targetTime: moveToTime,
          existingDate: splitDate,
          existingTime: splitTime,
        });
        return {
          hasConflict: true,
          conflictingExam: split,
        };
      } else {
        // SAME day/time = Will auto-merge later (not a conflict)
        console.log("Same day/time - will auto-merge after capacity check", {
          // debugging here
          courseCode: exam.courseCode,
          date: moveToDate,
          time: moveToTime,
        });
      }
    }

    // no conflicts were found here
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

    // capacity check (only if moving to a specific venue, not to reschedule)
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
        return; // return early - don't proceed with move or split check
      }
    }

    // split conflict check
    // build date
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
      console.log("SPLIT CONFLICT DETECTED:", {
        course: exam.courseCode,
        existingTime: splitCheck.conflictingExam.time,
        existingDate: splitCheck.conflictingExam.exam_date,
      });
      setSplitConflictInfo({
        courseCode: exam.courseCode,
        existingTime: splitCheck.conflictingExam.time,
        existingDate: splitCheck.conflictingExam.exam_date,
      });
      setSplitConflictOpen(true);
      return; // stop dont continue
    }

    // once split is safe then proceed
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

    // store info needed for later
    let shouldAutoMerge = false;
    let autoMergeDateStr = "";
    let autoMergeExam: Exam | null = null;

    if (isMovingToReschedule) {
      await moveActions.handleMoveToReschedule(pendingMove);
    } else if (isMovingFromReschedule && currentDate) {
      await moveActions.handleMoveFromReschedule(
        pendingMove,
        currentDate,
        rescheduleExams,
      );

      //auto-merge AFTER state refresh
      shouldAutoMerge = true;
      autoMergeDateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      autoMergeExam = {
        ...pendingMove.exam,
        time: Number(pendingMove.toColumnId),
        timeColumnId: pendingMove.toColumnId,
        venue_id: pendingMove.toVenueId!,
      };
    } else {
      await moveActions.handleSameDayTimeChange(pendingMove);

      // auto-merge AFTER state refresh
      if (selectedDateRef.current && pendingMove.toVenueId) {
        shouldAutoMerge = true;
        autoMergeDateStr = `${selectedDateRef.current.getFullYear()}-${String(
          selectedDateRef.current.getMonth() + 1,
        ).padStart(2, "0")}-${String(
          selectedDateRef.current.getDate(),
        ).padStart(2, "0")}`;
        autoMergeExam = {
          ...pendingMove.exam,
          time: Number(pendingMove.toColumnId),
          timeColumnId: pendingMove.toColumnId,
          venue_id: pendingMove.toVenueId,
        };
      }
    }

    // fetch fresh data from backend
    await fetchDaysWithExams();

    // auto-merge with fresh state
    if (shouldAutoMerge && autoMergeExam) {
      await autoMergeSameDayTimeSplits(autoMergeExam, autoMergeDateStr);
    }

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
