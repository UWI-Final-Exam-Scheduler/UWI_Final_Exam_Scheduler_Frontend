import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMergeSelection } from "@/app/hooks/useMergeSelection";
import { mockExam } from "../mocks/examMockData";

const makeSplits = () => [
  mockExam({ id: 1, number_of_students: 50 }),
  mockExam({ id: 2, number_of_students: 50 }),
  mockExam({ id: 3, number_of_students: 30 }),
];

describe("useMergeSelection", () => {
  it("should start with all splits selected", () => {
    const splits = makeSplits();
    const { result } = renderHook(() => useMergeSelection(splits));

    expect(result.current.selected.has(1)).toBe(true);
    expect(result.current.selected.has(2)).toBe(true);
    expect(result.current.selected.has(3)).toBe(true);
  });

  it("should calculate total students from all selected splits", () => {
    const splits = makeSplits();
    const { result } = renderHook(() => useMergeSelection(splits));

    expect(result.current.totalStudents).toBe(130); // 50 + 50 + 30
  });

  it("should deselect a split when toggled", () => {
    const splits = makeSplits();
    const { result } = renderHook(() => useMergeSelection(splits));

    act(() => {
      result.current.toggleSplit(1);
    });

    expect(result.current.selected.has(1)).toBe(false);
    expect(result.current.selected.has(2)).toBe(true);
  });

  it("should reselect a split when toggled again", () => {
    const splits = makeSplits();
    const { result } = renderHook(() => useMergeSelection(splits));

    act(() => {
      result.current.toggleSplit(1); // deselect
      result.current.toggleSplit(1); // reselect
    });

    expect(result.current.selected.has(1)).toBe(true);
  });

  it("should update total students when a split is deselected", () => {
    const splits = makeSplits();
    const { result } = renderHook(() => useMergeSelection(splits));

    act(() => {
      result.current.toggleSplit(3); // remove 30-student split
    });

    expect(result.current.totalStudents).toBe(100); // 50 + 50
  });

  it("should handle empty splits array", () => {
    const { result } = renderHook(() => useMergeSelection([]));

    expect(result.current.selected.size).toBe(0);
    expect(result.current.totalStudents).toBe(0);
  });
});
