import { useMemo } from "react";
import { useClashMatrix } from "./useClashMatrix";
import { useThresholdStates } from "@/app/state_management/thresholdStates";
import { Exam } from "@/app/components/types/calendarTypes";
import { normalizeCourseCode } from "@/app/lib/courseClashes";

export function useExamClashColors(
  exams: Exam[],
  prevDayExams: Exam[],
  nextDayExams: Exam[],
): Map<number, "orange" | "hotpink"> {
  const { absoluteThreshold, percentageThreshold } = useThresholdStates();
  const { clashPairsMap } = useClashMatrix(
    Number(absoluteThreshold),
    percentageThreshold,
  );

  return useMemo(() => {
    const result = new Map<number, "orange" | "hotpink">();

    const sameDay = new Set(
      exams.map((e) => normalizeCourseCode(e.courseCode)),
    );
    const adjacent = new Set(
      [...prevDayExams, ...nextDayExams].map((e) =>
        normalizeCourseCode(e.courseCode),
      ),
    );

    for (const exam of exams) {
      const code = normalizeCourseCode(exam.courseCode);
      const clashes = clashPairsMap.get(code) || new Set();

      const hasSameDayClash = [...clashes].some(
        (c) => c !== code && sameDay.has(c),
      );

      if (hasSameDayClash) {
        result.set(exam.id, "hotpink");
        continue;
      }

      const hasAdjacentClash = [...clashes].some((c) => adjacent.has(c));

      if (hasAdjacentClash) {
        result.set(exam.id, "orange");
      }
    }

    return result;
  }, [exams, prevDayExams, nextDayExams, clashPairsMap]);
}
