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
      const clashingWith = clashPairsMap.get(code) ?? new Map<string, number>();

      // priority 1 (red): same time slot AND same day
      const sameTimeClashExams = [...clashingWith.keys()]
        .filter((c) => c !== code && sameDayByCode.has(c))
        .flatMap((c) =>
          sameDayByCode.get(c)!.filter((e) => e.time === exam.time),
        );

      if (sameTimeClashExams.length > 0) {
        colorMap.set(exam.id, "red");
        clashExamsMap.set(exam.id, {
          clash: "same-day-time",
          clashExams: sameTimeClashExams.map((e) => ({
            exam: e,
            studentsAffected:
              clashingWith.get(normalizeCourseCode(e.courseCode)) ?? 0,
          })),
        });
        continue;
      }

      // priority 2 (hotpink): same day, any time
      const sameDayClashExams = [...clashingWith.keys()]
        .filter((c) => c !== code && sameDayByCode.has(c))
        .flatMap((c) => sameDayByCode.get(c)!);

      if (sameDayClashExams.length > 0) {
        colorMap.set(exam.id, "hotpink");
        clashExamsMap.set(exam.id, {
          clash: "sameday",
          clashExams: sameDayClashExams.map((e) => ({
            exam: e,
            studentsAffected:
              clashingWith.get(normalizeCourseCode(e.courseCode)) ?? 0,
          })),
        });
        continue;
      }

      // priority 3 (orange): adjacent day
      const adjacentClashExams = [...clashingWith.keys()]
        .filter((c) => adjacentByCode.has(c))
        .flatMap((c) => adjacentByCode.get(c)!);

      if (adjacentClashExams.length > 0) {
        colorMap.set(exam.id, "orange");
        clashExamsMap.set(exam.id, {
          clash: "adjacent",
          clashExams: adjacentClashExams.map((e) => ({
            exam: e,
            studentsAffected:
              clashingWith.get(normalizeCourseCode(e.courseCode)) ?? 0,
          })),
        });
      }
    }

    return { colorMap, clashExamsMap };
  }, [exams, prevDayExams, nextDayExams, clashPairsMap]);
}
