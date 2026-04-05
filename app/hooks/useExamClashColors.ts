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
  colorMap: Map<number, "orange" | "hotpink">;
  clashExamsMap: Map<number, ClashDetail>;
} {
  const { absoluteThreshold, percentageThreshold } = useThresholdStates();
  const { clashPairsMap } = useClashMatrix(
    Number(absoluteThreshold),
    percentageThreshold,
  );

  return useMemo(() => {
    const colorMap = new Map<number, "orange" | "hotpink">();
    const clashExamsMap = new Map<number, ClashDetail>();

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
      const sameDayByCode = new Map<string, Exam[]>();
      for (const e of exams) {
        const code = normalizeCourseCode(e.courseCode);
        if (!sameDayByCode.has(code)) sameDayByCode.set(code, []);
        sameDayByCode.get(code)!.push(e);
      }

      // Adjacent day clash = orange
      const adjacentByCode = new Map<string, Exam[]>();
      for (const e of [...prevDayExams, ...nextDayExams]) {
        const code = normalizeCourseCode(e.courseCode);
        if (!adjacentByCode.has(code)) adjacentByCode.set(code, []);
        adjacentByCode.get(code)!.push(e);
      }

      for (const exam of exams) {
        const code = normalizeCourseCode(exam.courseCode);
        const clashingWith = clashPairsMap.get(code) ?? new Set<string>();

        //  same day clashes takes priority
        // collecting all same-day exams whose course code clashes with this one.
        const sameDayClashExams = [...clashingWith]
          .filter((c) => c !== code && sameDayByCode.has(c))
          .flatMap((c) => sameDayByCode.get(c)!);

        if (sameDayClashExams.length > 0) {
          colorMap.set(exam.id, "hotpink");
          // storing clash detail with type "sameday" and the list of clashing exams.
          clashExamsMap.set(exam.id, {
            clash: "sameday",
            exams: sameDayClashExams,
          });
          continue;
        }

        // adjacent day clashes = orange
        const adjacentClashExams = [...clashingWith]
          .filter((c) => adjacentByCode.has(c))
          .flatMap((c) => adjacentByCode.get(c)!);

        if (adjacentClashExams.length > 0) {
          colorMap.set(exam.id, "orange");
          clashExamsMap.set(exam.id, {
            clash: "adjacent",
            exams: adjacentClashExams,
          });
        }
      }
    }
    return { colorMap, clashExamsMap };
  }, [exams, prevDayExams, nextDayExams, clashPairsMap]);
}
