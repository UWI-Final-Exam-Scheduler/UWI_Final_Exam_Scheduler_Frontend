import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCapacityFlag } from "@/app/hooks/useCapacityFlag";
import { mockExam } from "../mocks/examMockData";
import { mockVenues } from "../mocks/venueMockData";

// mockVenues(): [{ id:1, name:"MD2", capacity:100 }, { id:2, name:"MD3", capacity:80 }, { id:3, name:"JFK", capacity:150 }]

describe("useCapacityFlag", () => {
  it("builds an empty occupancyMap when there are no exams", () => {
    const { result } = renderHook(() => useCapacityFlag([], mockVenues()));
    expect(result.current.occupancyMap).toEqual({});
  });

  it("records student count in the correct venue and time slot", () => {
    const exam = mockExam({ venue_id: 1, timeColumnId: "9", number_of_students: 45 });
    const { result } = renderHook(() => useCapacityFlag([exam], mockVenues()));
    expect(result.current.occupancyMap[1]["9"]).toBe(45);
  });

  it("sums students across multiple exams in the same venue and slot", () => {
    const e1 = mockExam({ id: 1, venue_id: 1, timeColumnId: "9", number_of_students: 40 });
    const e2 = mockExam({ id: 2, venue_id: 1, timeColumnId: "9", number_of_students: 35 });
    const { result } = renderHook(() => useCapacityFlag([e1, e2], mockVenues()));
    expect(result.current.occupancyMap[1]["9"]).toBe(75);
  });

  it("tracks occupancy separately per venue", () => {
    const e1 = mockExam({ id: 1, venue_id: 1, timeColumnId: "9", number_of_students: 60 });
    const e2 = mockExam({ id: 2, venue_id: 2, timeColumnId: "9", number_of_students: 70 });
    const { result } = renderHook(() => useCapacityFlag([e1, e2], mockVenues()));
    expect(result.current.occupancyMap[1]["9"]).toBe(60);
    expect(result.current.occupancyMap[2]["9"]).toBe(70);
  });

  it("returns false when no exams occupy the target slot", () => {
    const { result } = renderHook(() => useCapacityFlag([], mockVenues()));
    // venue 1 capacity 100; 0 + 50 = 50 — within limit
    expect(result.current.wouldExceedCapacity(1, "9", 50)).toBe(false);
  });

  it("returns false when total stays within venue capacity", () => {
    const exam = mockExam({ venue_id: 1, timeColumnId: "9", number_of_students: 40 });
    const { result } = renderHook(() => useCapacityFlag([exam], mockVenues()));
    // 40 + 50 = 90 ≤ 100
    expect(result.current.wouldExceedCapacity(1, "9", 50)).toBe(false);
  });

  it("returns false at exact capacity (not strictly greater than)", () => {
    const exam = mockExam({ venue_id: 1, timeColumnId: "9", number_of_students: 50 });
    const { result } = renderHook(() => useCapacityFlag([exam], mockVenues()));
    // 50 + 50 = 100, which is NOT > 100
    expect(result.current.wouldExceedCapacity(1, "9", 50)).toBe(false);
  });

  it("returns true when adding incoming students would exceed capacity", () => {
    const exam = mockExam({ venue_id: 1, timeColumnId: "9", number_of_students: 80 });
    const { result } = renderHook(() => useCapacityFlag([exam], mockVenues()));
    // 80 + 30 = 110 > 100
    expect(result.current.wouldExceedCapacity(1, "9", 30)).toBe(true);
  });

  it("returns false for an unknown venue id (lets the drop through)", () => {
    const { result } = renderHook(() => useCapacityFlag([], mockVenues()));
    expect(result.current.wouldExceedCapacity(999, "9", 50)).toBe(false);
  });

  it("ignores exams in a different time slot when checking capacity", () => {
    // slot "1" is full but we are checking slot "9"
    const exam = mockExam({ venue_id: 1, timeColumnId: "1", number_of_students: 90 });
    const { result } = renderHook(() => useCapacityFlag([exam], mockVenues()));
    expect(result.current.wouldExceedCapacity(1, "9", 50)).toBe(false);
  });
});
