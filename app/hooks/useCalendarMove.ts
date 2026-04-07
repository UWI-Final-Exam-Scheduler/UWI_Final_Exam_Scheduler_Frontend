import { Exam, PendingMove } from "../components/types/calendarTypes";
import {
  formatDatetoString,
  rescheduleExam,
  mergeExam,
  splitExam,
} from "../lib/examFetch";
import { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";
import { Venue } from "../components/types/calendarTypes";

export function useCalendarMove(
  exams: Exam[],
  rescheduleExams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
  venues: Venue[],
) {
  const getMoveExamId = (move: PendingMove): number => {
    const parsed = Number(move.examId ?? move.exam.id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Invalid exam id for move operation");
    }
    return parsed;
  };

  async function handleMoveToReschedule(move: PendingMove) {
    const moveExamId = getMoveExamId(move);
    const courseCode = move.exam.courseCode;
    const existingRescheduleSplits = rescheduleExams.filter(
      (e) => e.courseCode === courseCode && e.id !== moveExamId,
    );

    const updatedExam = await rescheduleExam(moveExamId, 0, null, null, true);

    // Remove all splits from calendar
    setExams((prev) => prev.filter((e) => e.courseCode !== courseCode));

    let reschedulePayload: Exam[] = [
      {
        ...updatedExam,
        timeColumnId: "0",
      },
    ];
    // if there are already splits in reschedule, we assume the user wants to keep them separate so prevent auto merging if one split is returned to rescheduled
    if (existingRescheduleSplits.length > 0) {
      const desiredSplits = [
        ...existingRescheduleSplits.map((e) => ({
          number_of_students: e.number_of_students,
        })),
        { number_of_students: move.exam.number_of_students },
      ];

      if (desiredSplits.length >= 2 && desiredSplits.length <= 4) {
        try {
          const splitBack = await splitExam(updatedExam.id, desiredSplits);
          reschedulePayload = splitBack.map((e: Exam) => ({
            ...e,
            timeColumnId: "0",
          }));
        } catch (error) {
          console.error(
            "Failed to preserve split counts while moving to reschedule:",
            error,
          );
          toast.error(
            "Moved to reschedule, but could not preserve split counts",
          );
        }
      }
    }

    setRescheduleExams((prev) => [
      ...prev.filter((e) => e.courseCode !== courseCode),
      ...reschedulePayload,
    ]);

    addLog({
      action: "Move Exam to Reschedule",
      entityId: courseCode,
      oldValue: `Time: ${move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
      newValue: "To Be Rescheduled",
    });

    toast.success("Exam moved to reschedule 📝");
  }

  async function handleMoveFromReschedule(
    move: PendingMove,
    currentDate: Date,
  ) {
    const moveExamId = getMoveExamId(move);
    const newDateStr = formatDatetoString(currentDate);
    const courseCode = move.exam.courseCode;

    await rescheduleExam(
      moveExamId,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    // Check if other splits already exist in this slot
    const otherSplitsInSlot = exams.filter(
      (e) =>
        e.courseCode === courseCode &&
        e.exam_date === newDateStr &&
        e.timeColumnId === move.toColumnId &&
        e.id !== moveExamId,
    );
    const siblingRescheduleSplits = rescheduleExams.filter(
      (e) => e.courseCode === courseCode && e.id !== moveExamId,
    );

    if (otherSplitsInSlot.length > 0 || siblingRescheduleSplits.length > 0) {
      // Auto-merge with existing splits
      try {
        const targetVenueId = move.toVenueId ?? move.exam.venue_id;
        if (targetVenueId == null) {
          toast.error("Please choose a target venue before moving.");
          return;
        }

        const splitIdsForMerge = new Set<number>([
          moveExamId,
          ...otherSplitsInSlot.map((e) => e.id),
          ...siblingRescheduleSplits.map((e) => e.id),
        ]);

        const mergedIncomingStudents =
          move.exam.number_of_students +
          otherSplitsInSlot.reduce((sum, e) => sum + e.number_of_students, 0) +
          siblingRescheduleSplits.reduce(
            (sum, e) => sum + e.number_of_students,
            0,
          );

        const occupiedByOthersInTargetVenue = exams
          .filter(
            (e) =>
              e.exam_date === newDateStr &&
              e.timeColumnId === move.toColumnId &&
              e.venue_id === targetVenueId &&
              !splitIdsForMerge.has(e.id),
          )
          .reduce((sum, e) => sum + e.number_of_students, 0);

        const venueCapacity =
          venues.find((v) => v.id === targetVenueId)?.capacity ?? null;
        const canAutoMerge =
          venueCapacity === null ||
          occupiedByOthersInTargetVenue + mergedIncomingStudents <=
            venueCapacity;

        if (canAutoMerge) {
          const splitsToRelocate = otherSplitsInSlot.filter(
            (e) => e.venue_id !== targetVenueId,
          );

          if (splitsToRelocate.length > 0) {
            await Promise.all(
              splitsToRelocate.map((e) =>
                rescheduleExam(
                  e.id,
                  Number(move.toColumnId),
                  newDateStr,
                  targetVenueId,
                  false,
                ),
              ),
            );
          }

          if (siblingRescheduleSplits.length > 0) {
            await Promise.all(
              siblingRescheduleSplits.map((e) =>
                rescheduleExam(
                  e.id,
                  Number(move.toColumnId),
                  newDateStr,
                  targetVenueId,
                  false,
                ),
              ),
            );
          }

          const splitsToMerge = Array.from(
            new Set([
              moveExamId,
              ...otherSplitsInSlot.map((e) => e.id),
              ...siblingRescheduleSplits.map((e) => e.id),
            ]),
          );

          const merged = await mergeExam(splitsToMerge);

          // Remove from reschedule
          setRescheduleExams((prev: Exam[]) =>
            prev.filter((e: Exam) => !splitsToMerge.includes(e.id)),
          );

          // Replace old splits with merged result
          setExams((prev) => [
            ...prev.filter((e) => !splitsToMerge.includes(e.id)),
            ...merged.map((m: Exam) => ({
              ...m,
              timeColumnId: move.toColumnId,
              date: newDateStr,
              exam_date: newDateStr,
              venue_id: targetVenueId,
            })),
          ]);

          addLog({
            action: "Auto-Merge Exams",
            entityId: courseCode,
            oldValue: `${splitsToMerge.length} splits`,
            newValue: `Merged into ${merged.length} exam(s)`,
          });

          toast.success("Exams auto-merged successfully ✨");
          return;
        }
      } catch (err) {
        console.error("Auto-merge failed:", err);
        toast.error("Failed to auto-merge exams");
      }
    }

    // No merge — just move to calendar
    setRescheduleExams((prev: Exam[]) =>
      prev.filter((e: Exam) => e.id !== moveExamId),
    );

    setExams((prev: Exam[]) => [
      ...prev,
      {
        ...move.exam,
        date: newDateStr,
        exam_date: newDateStr,
        time: Number(move.toColumnId),
        timeColumnId: move.toColumnId,
        venue_id: move.toVenueId!,
      },
    ]);

    addLog({
      action: "Move Exam from Reschedule",
      entityId: courseCode,
      oldValue: "To Be Rescheduled",
      newValue: `Time: ${move.toColumnId}, Date: ${newDateStr}, Venue: ${move.toVenueId}`,
    });

    toast.success("Exam Rescheduled");
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    const moveExamId = getMoveExamId(move);
    await rescheduleExam(
      moveExamId,
      Number(move.toColumnId),
      undefined,
      move.toVenueId ?? null,
      false,
    );

    // check if there are OTHER splits of the same course in the SAME slot
    const updatedExams = exams.map((exam) =>
      exam.id === moveExamId
        ? {
            ...exam,
            time: Number(move.toColumnId),
            timeColumnId: move.toColumnId,
            venue_id: move.toVenueId ?? exam.venue_id,
          }
        : exam,
    );
    setExams(updatedExams);

    // check if there are OTHER splits of the same course in the SAME slot
    const otherSplitsInSlot = updatedExams.filter(
      (e) =>
        e.courseCode === move.exam.courseCode &&
        e.exam_date === move.exam.exam_date &&
        e.timeColumnId === move.toColumnId &&
        e.id !== moveExamId, // exclude the moved exam
    );

    // if other splits exist, auto-merge them
    if (otherSplitsInSlot.length > 0) {
      try {
        const targetVenueId = move.toVenueId ?? move.exam.venue_id;
        const splitIdsForMerge = new Set<number>([
          moveExamId,
          ...otherSplitsInSlot.map((e) => e.id),
        ]);

        const mergedIncomingStudents =
          move.exam.number_of_students +
          otherSplitsInSlot.reduce((sum, e) => sum + e.number_of_students, 0);

        const occupiedByOthersInTargetVenue = updatedExams
          .filter(
            (e) =>
              e.exam_date === move.exam.exam_date &&
              e.timeColumnId === move.toColumnId &&
              e.venue_id === targetVenueId &&
              !splitIdsForMerge.has(e.id),
          )
          .reduce((sum, e) => sum + e.number_of_students, 0);

        const venueCapacity =
          venues.find((v) => v.id === targetVenueId)?.capacity ?? null;
        const canAutoMerge =
          venueCapacity === null ||
          occupiedByOthersInTargetVenue + mergedIncomingStudents <=
            venueCapacity;

        if (!canAutoMerge) {
          addLog({
            action: "Move Exam Same Day",
            entityId: move.exam.courseCode,
            oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
            newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
          });
          return;
        }

        const splitsToRelocate = otherSplitsInSlot.filter(
          (e) => e.venue_id !== targetVenueId,
        );

        if (splitsToRelocate.length > 0) {
          await Promise.all(
            splitsToRelocate.map((e) =>
              rescheduleExam(
                e.id,
                Number(move.toColumnId),
                undefined,
                targetVenueId,
                false,
              ),
            ),
          );
        }

        const splitsToMerge = [
          moveExamId,
          ...otherSplitsInSlot.map((e) => e.id),
        ];

        const merged = await mergeExam(splitsToMerge);

        // Remove old splits and add merged exam
        setExams((prev) => [
          ...prev.filter((e) => !splitsToMerge.includes(e.id)),
          ...merged.map((m: Exam) => ({
            ...m,
            time: Number(move.toColumnId),
            timeColumnId: String(m.time),
            date: move.exam.exam_date,
            exam_date: move.exam.exam_date,
            venue_id: targetVenueId,
          })),
        ]);

        addLog({
          action: "Auto-Merge Exams",
          entityId: move.exam.courseCode,
          oldValue: `${splitsToMerge.length} splits`,
          newValue: `Merged into ${merged.length} exam(s)`,
        });

        toast.success("Exams auto-merged successfully ✨");
      } catch (err) {
        console.error("Auto-merge failed:", err);
        toast.error("Failed to auto-merge exams");
      }
    } else {
      // No other splits, just log the move
      addLog({
        action: "Move Exam Same Day",
        entityId: move.exam.courseCode,
        oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
        newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
      });

      toast.success("Exam moved successfully");
    }
  }

  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
