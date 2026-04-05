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
    const colorMap = new Map<number, "orange" | "hotpink">();

    const sameDayCodes = new Set(
      exams.map((e) => normalizeCourseCode(e.courseCode)),
    );
    const adjacentCodes = new Set([
      ...prevDayExams.map((e) => normalizeCourseCode(e.courseCode)),
      ...nextDayExams.map((e) => normalizeCourseCode(e.courseCode)),
    ]);

    for (const exam of exams) {
      const code = normalizeCourseCode(exam.courseCode);
      const clashingWith = clashPairsMap.get(code) ?? new Set<string>();

      // Same-day clash takes priority = hot pink
      const sameDayClash = [...clashingWith].some(
        (c) => sameDayCodes.has(c) && c !== code,
      );
      if (sameDayClash) {
        colorMap.set(exam.id, "hotpink");
        continue;
      }

      // Adjacent day clash = orange
      const adjacentClash = [...clashingWith].some((c) => adjacentCodes.has(c));
      if (adjacentClash) {
        colorMap.set(exam.id, "orange");
      }
    }

    return colorMap;
  }, [exams, prevDayExams, nextDayExams, clashPairsMap]);
}
