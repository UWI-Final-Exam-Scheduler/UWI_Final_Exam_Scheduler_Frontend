import { Exam, PendingMove } from "../components/types/calendarTypes";
import { formatDatetoString, rescheduleExam } from "../lib/examFetch";
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

    // Step 1: Move this split to calendar
    await rescheduleExam(
      move.exam.id,
      Number(move.toColumnId),
      newDateStr,
      move.toVenueId,
      false,
    );

    // Step 2: Find remaining reschedule splits for this course
    const otherRescheduleSplits = rescheduleExamsList.filter(
      (e: Exam) => e.courseCode === courseCode && String(e.id) !== move.examId, // ✅ TYPE: Exam
    );

    // Step 3: If other reschedule splits exist, MERGE them into one
    if (otherRescheduleSplits.length > 0) {
      // Merge all remaining splits into a single exam
      const mergedExam = await rescheduleExam(
        otherRescheduleSplits[0].id,
        0,
        null,
        null,
        true, // This merges them
      );

      setRescheduleExams((prev: Exam[]) => [
        // Remove all splits of this course
        ...prev.filter((e: Exam) => e.courseCode !== courseCode),
        // Add the newly merged exam
        {
          ...mergedExam,
          timeColumnId: "0",
        },
      ]);
    } else {
      // No other splits, just remove this one from reschedule
      setRescheduleExams((prev: Exam[]) =>
        prev.filter((e: Exam) => String(e.id) !== move.examId),
      );
    }

    // Step 4: Add moved exam to calendar
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

    toast.success("Exam Rescheduled & splits merged ✅");
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

    toast.success("Exam moved successfully ✅");
  }
  return {
    handleMoveToReschedule,
    handleMoveFromReschedule,
    handleSameDayTimeChange,
  };
}
