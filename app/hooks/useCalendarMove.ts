import { Exam, PendingMove } from "../components/types/calendarTypes";
import {
  formatDatetoString,
  rescheduleExam,
  mergeExam,
} from "../lib/examFetch";
import { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";
import { addLog } from "@/app/lib/activityLog";

export function useCalendarMove(
  exams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
) {
  async function handleMoveToReschedule(move: PendingMove) {
    console.log("moving to reschedule:", move.exam.id, move.exam.courseCode); // DEBUGGING
    const courseCode = move.exam.courseCode;
    const splits = exams.filter((e) => e.courseCode === courseCode);

    const updatedExam = await rescheduleExam(splits[0].id, 0, null, null, true);

    // remove all splits from calendar
    setExams((prev) => prev.filter((e) => e.courseCode !== courseCode));

    // add the REAL merged exam from backend
    setRescheduleExams((prev) => [
      ...prev,
      {
        ...updatedExam,
        timeColumnId: "0",
      },
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
    rescheduleExamsList: Exam[],
  ) {
    const newDateStr = formatDatetoString(currentDate);
    const courseCode = move.exam.courseCode;

    // Move this split to calendar
    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    // Find remaining reschedule splits for this course
    const otherRescheduleSplits = rescheduleExamsList.filter(
      (e: Exam) => e.courseCode === courseCode && String(e.id) !== move.examId,
    );

    // handle remaining splits
    // Only merge if there are 2 or more splits to merge
    if (otherRescheduleSplits.length >= 2) {
      try {
        const mergedExams = await mergeExam(
          otherRescheduleSplits.map((e: Exam) => e.id),
        );
        const mergedExam = mergedExams[0];

        setRescheduleExams((prev: Exam[]) => [
          // Remove all splits of this course AND the moved exam
          ...prev.filter(
            (e: Exam) =>
              e.courseCode !== courseCode && String(e.id) !== move.examId,
          ),
          // Add back only the merged exam
          {
            ...mergedExam,
            timeColumnId: "0",
          },
        ]);

        toast.success(`✅ Merged ${otherRescheduleSplits.length} exam splits`);
      } catch (error) {
        console.error("Merge failed:", error);
        toast.error("Failed to merge exam splits");
      }
    } else if (otherRescheduleSplits.length === 1) {
      // Only 1 split remaining - just remove the moved one
      setRescheduleExams((prev: Exam[]) =>
        prev.filter((e: Exam) => String(e.id) !== move.examId),
      );
    } else {
      // No other splits - just remove the moved one
      setRescheduleExams((prev: Exam[]) =>
        prev.filter((e: Exam) => String(e.id) !== move.examId),
      );
    }

    // Add moved exam to calendar
    setExams((prev: Exam[]) => [
      ...prev,
      {
        ...move.exam,
        date: newDateStr,
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

    toast.success("Exam Rescheduled & splits merged");
  }

  async function handleSameDayTimeChange(move: PendingMove) {
    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      undefined,
      move.toVenueId ?? null,
      false,
    );

    setExams((prev) =>
      prev.map((exam) =>
        String(exam.id) === move.examId
          ? {
              ...exam,
              time: Number(move.toColumnId),
              timeColumnId: move.toColumnId,
              venue_id: move.toVenueId ?? exam.venue_id,
            }
          : exam,
      ),
    );

    addLog({
      action: "Move Exam Same Day",
      entityId: move.exam.courseCode,
      oldValue: `Time: ${move.fromColumnId ?? move.exam.timeColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.exam.venue_id}`,
      newValue: `Time: ${move.toColumnId}, Date: ${move.exam.exam_date}, Venue: ${move.toVenueId ?? move.exam.venue_id}`,
    });

    toast.success("Exam moved successfully");
  }
  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
