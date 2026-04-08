import { useState, Dispatch, SetStateAction } from "react";
import { Exam } from "../components/types/calendarTypes";
import { splitExam, mergeExam } from "../lib/examFetch";
import { toast } from "react-hot-toast";

export function useExamSplitMerge(
  exams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
  rescheduleExams: Exam[],
  setRescheduleExams: Dispatch<SetStateAction<Exam[]>>,
  refetch?: () => Promise<void>,
) {
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const isReschedule = activeExam?.timeColumnId === "0";

  function onSplit(exam: Exam) {
    setActiveExam(exam);
    setSplitDialogOpen(true);
  }

  function onMerge(exam: Exam) {
    setActiveExam(exam);
    setMergeDialogOpen(true);
  }

  function onCloseSplit() {
    setSplitDialogOpen(false);
    setActiveExam(null);
  }

  function onCloseMerge() {
    setMergeDialogOpen(false);
    setActiveExam(null);
  }

  async function onSplitConfirm(splits: { number_of_students: number }[]) {
    if (!activeExam) return;
    try {
      const newExams = await splitExam(
        activeExam.id,
        splits,
        activeExam.venue_id ?? undefined,
        activeExam.time ?? undefined,
        activeExam.date ?? undefined,
      );
      const inheritedExams = newExams.map((exam: Exam) => ({
        ...exam,
        venue_id: activeExam.venue_id,
        time: activeExam.time,
        timeColumnId: activeExam.timeColumnId ?? String(activeExam.time),
        date: activeExam.date,
        exam_date: activeExam.exam_date,
      }));
      if (isReschedule) {
        setRescheduleExams((prev) => [
          ...prev.filter((e) => e.id !== activeExam.id),
          ...inheritedExams.map((e: Exam) => ({ ...e, timeColumnId: "0" })),
        ]);
      } else {
        setExams((prev) => [
          ...prev.filter((e) => e.id !== activeExam.id),
          ...inheritedExams,
        ]);
      }
      onCloseSplit();
      await refetch?.();
    } catch (error) {
      console.error("Failed to split exam:", error);
    }
  }

  async function onMergeConfirm(examIds: number[], moveToReschedule = false) {
    try {
      const merged = await mergeExam(examIds);
      const shouldMoveToReschedule = Boolean(moveToReschedule && !isReschedule);

      if (shouldMoveToReschedule) {
        // if there is overflow, move merged exam to reschedule
        if (isReschedule) {
          setRescheduleExams((prev) => [
            ...prev.filter((e) => !examIds.includes(e.id)),
            ...merged.map((m: Exam) => ({ ...m, timeColumnId: "0" })),
          ]);
        } else {
          // Remove from calendar, add to reschedule
          setExams((prev) => prev.filter((e) => !examIds.includes(e.id)));
          setRescheduleExams((prev) => [
            ...prev,
            ...merged.map((m: Exam) => ({ ...m, timeColumnId: "0" })),
          ]);
        }
        toast.success("Merged exam moved to reschedule due to capacity");
      } else {
        // Normal merge (no overflow)
        if (isReschedule) {
          setRescheduleExams((prev) => [
            ...prev.filter((e) => !examIds.includes(e.id)),
            ...merged.map((m: Exam) => ({ ...m, timeColumnId: "0" })),
          ]);
        } else {
          setExams((prev) => [
            ...prev.filter((e) => !examIds.includes(e.id)),
            ...merged.map((m: Exam) => ({
              ...m,
              // Keep merged exams in the active calendar slot for immediate UI update.
              timeColumnId:
                m.time != null
                  ? String(m.time)
                  : (activeExam?.timeColumnId ?? "0"),
              time: m.time ?? activeExam?.time,
              date: m.date ?? activeExam?.date,
              exam_date: m.exam_date ?? activeExam?.exam_date,
              venue_id: m.venue_id ?? activeExam?.venue_id,
            })),
          ]);
        }
        toast.success("Exams merged successfully");
      }

      await refetch?.();
    } catch (error) {
      console.error("Failed to merge exams:", error);
      toast.error("Failed to merge exams");
    }
    onCloseMerge();
  }
  const source = isReschedule ? rescheduleExams : exams;

  const examSplits = activeExam
    ? source.filter((e) => e.courseCode === activeExam.courseCode)
    : [];

  return {
    activeExam,
    examSplits,
    splitDialogOpen,
    mergeDialogOpen,
    onSplit,
    onMerge,
    onCloseSplit,
    onCloseMerge,
    onSplitConfirm,
    onMergeConfirm,
  };
}
