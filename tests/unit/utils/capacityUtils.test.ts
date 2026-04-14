import { describe, it, expect } from "vitest";
import { getCapacityStatus } from "@/app/lib/capacityUtils";
import { mockExam } from "../mocks/examMockData";

describe("Capacity Display", () => {
  // green: under 80%
  it("should return green class when under 80% capacity", () => {
    const exams = [mockExam({ number_of_students: 70 })];
    const { occupied, colorClass } = getCapacityStatus(exams, 100);

    expect(occupied).toBe(70);
    expect(colorClass).toBe("text-green-600");
  });

  // orange: 80–99%
  it("should return orange class when between 80% and 100% capacity", () => {
    const exams = [mockExam({ number_of_students: 80 })];
    const { occupied, colorClass } = getCapacityStatus(exams, 100);

    expect(occupied).toBe(80);
    expect(colorClass).toBe("text-orange-500");
  });

  it("should return orange class at exactly 80% capacity", () => {
    const exams = [mockExam({ number_of_students: 80 })];
    const { colorClass } = getCapacityStatus(exams, 100);

    expect(colorClass).toBe("text-orange-500");
  });

  // red: 100%+
  it("should return red class when at exactly 100% capacity", () => {
    const exams = [mockExam({ number_of_students: 100 })];
    const { colorClass } = getCapacityStatus(exams, 100);

    expect(colorClass).toBe("text-red-600");
  });

  it("should return red class when over 100% capacity", () => {
    const exams = [mockExam({ number_of_students: 120 })];
    const { colorClass } = getCapacityStatus(exams, 100);

    expect(colorClass).toBe("text-red-600");
  });

  // Multiple exams summed
  it("should sum students across multiple exams in the same slot", () => {
    const exams = [
      mockExam({ id: 1, number_of_students: 40 }),
      mockExam({ id: 2, number_of_students: 40 }),
    ];
    const { occupied } = getCapacityStatus(exams, 100);

    expect(occupied).toBe(80);
  });

  // Empty slot
  it("should return 0 occupied and green when no exams", () => {
    const { occupied, colorClass } = getCapacityStatus([], 100);

    expect(occupied).toBe(0);
    expect(colorClass).toBe("text-green-600");
  });

  // Edge: zero capacity venue
  it("should handle zero capacity venue without crashing", () => {
    const exams = [mockExam({ number_of_students: 10 })];
    const { colorClass } = getCapacityStatus(exams, 0);

    // pct = 0 when capacity is 0, so green
    expect(colorClass).toBe("text-green-600");
  });
});
