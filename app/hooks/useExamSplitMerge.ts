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
    const newExams = await splitExam(activeExam.courseCode, splits);
    setExams((prev) => [
      ...prev.filter((e) => e.courseCode !== activeExam.courseCode),
      ...newExams,
    ]);
    onCloseSplit();
  }

  async function onMergeConfirm(examIds: number[]) {
    const merged = await mergeExam(examIds);
    setExams((prev) => [
      ...prev.filter((e) => !examIds.includes(e.id)),
      merged,
    ]);
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
