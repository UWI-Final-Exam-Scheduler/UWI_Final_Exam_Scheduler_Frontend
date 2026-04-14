import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useExamClashColors } from "@/app/hooks/useExamClashColors";
import { Exam } from "@/app/components/types/calendarTypes";

vi.mock("@/app/hooks/useClashMatrix", () => ({
  useClashMatrix: () => ({
    clashPairsMap: new Map([
      ["COMP1601", new Map([["MATH1115", 12]])],
      ["MATH1115", new Map([["COMP1601", 12]])],
    ]),
  }),
}));

vi.mock("@/app/state_management/thresholdStates", () => ({
  useThresholdStates: () => ({
    absoluteThreshold: 0,
    percentageThreshold: 0,
  }),
}));

const makeExam = (overrides: Partial<Exam>): Exam => ({
  id: 1,
  courseCode: "COMP1601",
  exam_date: "2025-05-12",
  date: "2025-05-12",
  time: 9,
  timeColumnId: "9",
  venue_id: 1,
  exam_length: 120,
  number_of_students: 45,
  ...overrides,
});

describe("useExamClashColors", () => {
  it("should return colorMap and clashExamsMap", () => {
    const { result } = renderHook(() =>
      useExamClashColors([makeExam({})], [], []),
    );

    expect(result.current.colorMap).toBeInstanceOf(Map);
    expect(result.current.clashExamsMap).toBeInstanceOf(Map);
  });

  it("should assign red for same-time same-day clashes", () => {
    const exams = [
      makeExam({ id: 1, courseCode: "COMP1601", time: 9 }),
      makeExam({ id: 2, courseCode: "MATH1115", time: 9 }),
    ];

    const { result } = renderHook(() => useExamClashColors(exams, [], []));

    expect(result.current.colorMap.get(1)).toBe("red");
    expect(result.current.colorMap.get(2)).toBe("red");
  });

  it("should assign hotpink for same-day different-time clashes", () => {
    const exams = [
      makeExam({ id: 1, courseCode: "COMP1601", time: 9 }),
      makeExam({ id: 2, courseCode: "MATH1115", time: 13 }),
    ];

    const { result } = renderHook(() => useExamClashColors(exams, [], []));

    expect(result.current.colorMap.get(1)).toBe("hotpink");
    expect(result.current.colorMap.get(2)).toBe("hotpink");
  });

  it("should assign orange for adjacent-day clashes", () => {
    const todayExams = [makeExam({ id: 1, courseCode: "COMP1601", time: 9 })];
    const nextDayExams = [
      makeExam({ id: 2, courseCode: "MATH1115", exam_date: "2025-05-13" }),
    ];

    const { result } = renderHook(() =>
      useExamClashColors(todayExams, [], nextDayExams),
    );

    expect(result.current.colorMap.get(1)).toBe("orange");
  });

  it("should prioritise red over hotpink", () => {
    // COMP1601 clashes with MATH1115 at same time (red)
    // but also has another course on same day (would be hotpink)
    const exams = [
      makeExam({ id: 1, courseCode: "COMP1601", time: 9 }),
      makeExam({ id: 2, courseCode: "MATH1115", time: 9 }), // same time
    ];

    const { result } = renderHook(() => useExamClashColors(exams, [], []));

    expect(result.current.colorMap.get(1)).toBe("red");
    expect(result.current.colorMap.get(1)).not.toBe("hotpink");
  });

  it("should prioritise hotpink over orange", () => {
    const todayExams = [
      makeExam({ id: 1, courseCode: "COMP1601", time: 9 }),
      makeExam({ id: 2, courseCode: "MATH1115", time: 13 }), // same day
    ];
    const nextDayExams = [
      makeExam({ id: 3, courseCode: "MATH1115", exam_date: "2025-05-13" }),
    ];

    const { result } = renderHook(() =>
      useExamClashColors(todayExams, [], nextDayExams),
    );

    expect(result.current.colorMap.get(1)).toBe("hotpink");
    expect(result.current.colorMap.get(1)).not.toBe("orange");
  });

  it("should include studentsAffected in clash details", () => {
    const exams = [
      makeExam({ id: 1, courseCode: "COMP1601", time: 9 }),
      makeExam({ id: 2, courseCode: "MATH1115", time: 9 }),
    ];

    const { result } = renderHook(() => useExamClashColors(exams, [], []));

    const detail = result.current.clashExamsMap.get(1);
    expect(detail?.clashExams[0].studentsAffected).toBe(12);
  });

  it("should not assign any color to exams with no clashes", () => {
    const exams = [makeExam({ id: 1, courseCode: "FOST6002", time: 9 })];

    const { result } = renderHook(() => useExamClashColors(exams, [], []));

    expect(result.current.colorMap.get(1)).toBeUndefined();
  });

  it("should not duplicate splits in clash detail", () => {
    const exams = [
      makeExam({ id: 1, courseCode: "COMP1601", time: 9 }),
      makeExam({ id: 2, courseCode: "MATH1115", time: 9 }),
      makeExam({ id: 3, courseCode: "MATH1115", time: 9 }), // split of MATH1115
    ];

    const { result } = renderHook(() => useExamClashColors(exams, [], []));

    const detail = result.current.clashExamsMap.get(1);
    // MATH1115 should only appear once despite having 2 splits
    expect(detail?.clashExams).toHaveLength(1);
  });
});
