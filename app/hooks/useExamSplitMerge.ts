import { useState, Dispatch, SetStateAction } from "react";
import { Exam } from "../components/types/calendarTypes";
import { splitExam, mergeExam, rescheduleExam } from "../lib/examFetch";
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
  const [updatingZoneIds, setUpdatingZoneIds] = useState<string[]>([]);
  const isReschedule = activeExam?.timeColumnId === "0";

  const buildCurrentZoneId = (exam: Exam) => {
    if (exam.timeColumnId === "0") return "0";
    return `${exam.timeColumnId}-${exam.venue_id}`;
  };

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
    const sourceZoneId = buildCurrentZoneId(activeExam);
    setUpdatingZoneIds([sourceZoneId]);
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
    } finally {
      setUpdatingZoneIds([]);
    }
  }

  async function onMergeConfirm(examIds: number[], moveToReschedule = false) {
    if (!activeExam) return;
    const knownExams = [...exams, ...rescheduleExams];
    const selectedSourceZoneIds = knownExams
      .filter((e) => examIds.includes(e.id))
      .map((e) => buildCurrentZoneId(e));

    const sourceZoneIds =
      selectedSourceZoneIds.length > 0
        ? selectedSourceZoneIds
        : [buildCurrentZoneId(activeExam)];

    const shouldMoveToReschedule = Boolean(moveToReschedule && !isReschedule);
    const targetZoneIds = shouldMoveToReschedule
      ? [...sourceZoneIds, "0"]
      : sourceZoneIds;
    setUpdatingZoneIds(Array.from(new Set(targetZoneIds)));

    try {
      const merged = await mergeExam(examIds);
      let mergedExams = merged;

      if (shouldMoveToReschedule && merged.length > 0) {
        // Persist the move to reschedule in backend after merge to avoid local/backend drift.
        mergedExams = await Promise.all(
          merged.map(async (m: Exam) => {
            const updated = await rescheduleExam(
              m.id,
              0,
              null,
              null,
              true,
              true,
            );
            return { ...updated, timeColumnId: "0", time: 0 };
          }),
        );
      }

      const normalizedMerged = mergedExams.map((m: Exam) => {
        const inferredTimeColumnId =
          m.timeColumnId ??
          (m.time != null ? String(m.time) : null) ??
          activeExam?.timeColumnId ??
          "0";

        return {
          ...m,
          timeColumnId: inferredTimeColumnId,
          time: m.time ?? activeExam?.time,
          date: m.date ?? activeExam?.date,
          exam_date: m.exam_date ?? activeExam?.exam_date,
          venue_id: m.venue_id ?? activeExam?.venue_id,
        };
      });

      const rescheduleMerged = normalizedMerged.filter(
        (m: Exam) => m.timeColumnId === "0" || Number(m.time) === 0,
      );
      const scheduledMerged = normalizedMerged.filter(
        (m: Exam) => !(m.timeColumnId === "0" || Number(m.time) === 0),
      );

      setExams((prev) => [
        ...prev.filter((e) => !examIds.includes(e.id)),
        ...scheduledMerged,
      ]);

      setRescheduleExams((prev) => [
        ...prev.filter((e) => !examIds.includes(e.id)),
        ...rescheduleMerged.map((m: Exam) => ({
          ...m,
          timeColumnId: "0",
          time: 0,
        })),
      ]);

      if (shouldMoveToReschedule) {
        toast.success("Merged exam moved to reschedule due to capacity");
      } else {
        toast.success("Exams merged successfully");
      }

      await refetch?.();
    } catch (error) {
      console.error("Failed to merge exams:", error);
      toast.error("Failed to merge exams");
    } finally {
      setUpdatingZoneIds([]);
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
    updatingZoneIds,
  };
}
