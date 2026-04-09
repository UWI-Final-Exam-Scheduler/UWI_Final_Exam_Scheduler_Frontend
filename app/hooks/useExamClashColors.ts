import { useMemo } from "react";
import { useClashMatrix } from "./useClashMatrix";
import { useThresholdStates } from "@/app/state_management/thresholdStates";
import { Exam, ClashDetail } from "@/app/components/types/calendarTypes";
import { normalizeCourseCode } from "@/app/lib/courseClashes";

export function useExamClashColors(
  exams: Exam[],
  prevDayExams: Exam[],
  nextDayExams: Exam[],
): {
  colorMap: Map<number, "orange" | "hotpink" | "red">;
  clashExamsMap: Map<number, ClashDetail>;
} {
  const { absoluteThreshold, percentageThreshold } = useThresholdStates();
  const { clashPairsMap } = useClashMatrix(
    Number(absoluteThreshold),
    percentageThreshold,
  );

  return useMemo(() => {
    const colorMap = new Map<number, "orange" | "hotpink" | "red">();
    const clashExamsMap = new Map<number, ClashDetail>();

    const sameDayByCode = new Map<string, Exam[]>();
    for (const e of exams) {
      const c = normalizeCourseCode(e.courseCode);
      if (!sameDayByCode.has(c)) sameDayByCode.set(c, []);
      sameDayByCode.get(c)!.push(e);
    }

    const adjacentByCode = new Map<string, Exam[]>();
    for (const e of [...prevDayExams, ...nextDayExams]) {
      const c = normalizeCourseCode(e.courseCode);
      if (!adjacentByCode.has(c)) adjacentByCode.set(c, []);
      adjacentByCode.get(c)!.push(e);
    }

    for (const exam of exams) {
      const code = normalizeCourseCode(exam.courseCode);
      // clashingWith is Map<courseCode, studentsAffected> from the combined clashPairsMap
      const clashingWith = clashPairsMap.get(code) ?? new Map<string, number>();

      // priority 1 (red): same time slot AND same day
      // flatMap returns [] if no split matches the time, or [item] if one does
      // one entry per clashing course code, no duplicate splits
      const sameTimeItems = [...clashingWith.keys()]
        .filter((c) => c !== code && sameDayByCode.has(c))
        .flatMap((c) => {
          const first = sameDayByCode.get(c)!.find((e) => e.time === exam.time);
          return first
            ? [{ exam: first, studentsAffected: clashingWith.get(c) ?? 0 }]
            : [];
        });

      if (sameTimeItems.length > 0) {
        colorMap.set(exam.id, "red");
        clashExamsMap.set(exam.id, {
          clash: "same-day-time",
          clashExams: sameTimeItems,
        });
        continue;
      }

      // priority 2 (hotpink): same day, any time
      // .map() over course codes, one entry per course, first split is representative
      const sameDayItems = [...clashingWith.keys()]
        .filter((c) => c !== code && sameDayByCode.has(c))
        .map((c) => ({
          exam: sameDayByCode.get(c)![0],
          studentsAffected: clashingWith.get(c) ?? 0,
        }));

      if (sameDayItems.length > 0) {
        colorMap.set(exam.id, "hotpink");
        clashExamsMap.set(exam.id, {
          clash: "sameday",
          clashExams: sameDayItems,
        });
        continue;
      }

      // priority 3 (orange): adjacent day
      const adjacentItems = [...clashingWith.keys()]
        .filter((c) => adjacentByCode.has(c))
        .map((c) => ({
          exam: adjacentByCode.get(c)![0],
          studentsAffected: clashingWith.get(c) ?? 0,
        }));

      if (adjacentItems.length > 0) {
        colorMap.set(exam.id, "orange");
        clashExamsMap.set(exam.id, {
          clash: "adjacent",
          clashExams: adjacentItems,
        });
      }
    }

    return { colorMap, clashExamsMap };
  }, [exams, prevDayExams, nextDayExams, clashPairsMap]);
}
