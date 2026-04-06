import { useState, Dispatch, SetStateAction } from "react";
import { Exam } from "../components/types/calendarTypes";
import { splitExam, mergeExam } from "../lib/examFetch";

export function useExamSplitMerge(
  exams: Exam[],
  setExams: Dispatch<SetStateAction<Exam[]>>,
) {
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

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
        timeColumnId: String(activeExam.time),
        date: activeExam.date,
        exam_date: activeExam.exam_date,
      }));
      setExams((prev) => [
        ...prev.filter((e) => e.courseCode !== activeExam.courseCode),
        ...inheritedExams,
      ]);
      onCloseSplit();
    } catch (error) {
      console.error("Failed to split exam:", error);
    }
  }

  async function onMergeConfirm(examIds: number[]) {
    try {
      const merged = await mergeExam(examIds);
      setExams((prev) => [
        ...prev.filter((e) => !examIds.includes(e.id)),
        ...merged,
      ]);
    } catch (error) {
      console.error("Failed to merge exams:", error);
    }
    onCloseMerge();
  }

  const examSplits = activeExam
    ? exams.filter((e) => e.courseCode === activeExam.courseCode)
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
