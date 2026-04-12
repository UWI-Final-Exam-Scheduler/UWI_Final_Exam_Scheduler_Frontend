import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSplitAllocation } from "@/app/hooks/useSplitAllocation";

describe("useSplitAllocation", () => {
  it("should return remaining = total when no students allocated", () => {
    const splits = [{ number_of_students: 0 }, { number_of_students: 0 }];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.allocated).toBe(0);
    expect(result.current.remaining).toBe(100);
  });

  it("should calculate allocated correctly", () => {
    const splits = [{ number_of_students: 60 }, { number_of_students: 40 }];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.allocated).toBe(100);
    expect(result.current.remaining).toBe(0);
  });

  it("should be valid when splits sum exactly to total and all > 0", () => {
    const splits = [{ number_of_students: 60 }, { number_of_students: 40 }];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.isValid).toBe(true);
  });

  it("should be invalid when splits do not sum to total", () => {
    const splits = [{ number_of_students: 50 }, { number_of_students: 30 }];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.isValid).toBe(false);
  });

  it("should be invalid when any split has 0 students", () => {
    const splits = [{ number_of_students: 100 }, { number_of_students: 0 }];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.isValid).toBe(false);
  });

  it("should show negative remaining when over-allocated", () => {
    const splits = [{ number_of_students: 80 }, { number_of_students: 40 }];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.remaining).toBe(-20);
    expect(result.current.isValid).toBe(false);
  });

  it("should handle 3 splits correctly", () => {
    const splits = [
      { number_of_students: 40 },
      { number_of_students: 30 },
      { number_of_students: 30 },
    ];
    const { result } = renderHook(() => useSplitAllocation(splits, 100));

    expect(result.current.allocated).toBe(100);
    expect(result.current.isValid).toBe(true);
  });
});
