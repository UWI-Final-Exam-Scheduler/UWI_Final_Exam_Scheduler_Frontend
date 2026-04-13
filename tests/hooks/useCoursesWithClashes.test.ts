import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCoursesWithClashes } from "@/app/hooks/useCoursesWithClashes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/app/hooks/useClashMatrix", () => ({
  useClashMatrix: vi.fn(),
}));

import { useClashMatrix } from "@/app/hooks/useClashMatrix";

const mockClashSet = new Set(["COMP3603", "MATH2150"]);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return Wrapper;
}

describe("useCoursesWithClashes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useClashMatrix).mockReturnValue({
      coursesWithClashes: mockClashSet,
      loadingClashes: false,
      clashError: "",
      refetch: vi.fn(),
      uniqueClashCount: 2,
      totalStudentsAffected: 100,
      percentageStudentsAffected: 15.5,
      clashPairsMap: new Map(),
      clashCountMap: new Map(),
    });
  });

  it("maps useClashMatrix result to courseClashesSet", () => {
    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.courseClashesSet).toBe(mockClashSet);
  });

  it("passes absoluteThreshold to useClashMatrix", () => {
    renderHook(() => useCoursesWithClashes(10, 15), {
      wrapper: createWrapper(),
    });

    expect(useClashMatrix).toHaveBeenCalledWith(10, 15);
  });

  it("passes percentageThreshold to useClashMatrix", () => {
    renderHook(() => useCoursesWithClashes(5, 20), {
      wrapper: createWrapper(),
    });

    expect(useClashMatrix).toHaveBeenCalledWith(5, 20);
  });

  it("exposes loadingClashes from useClashMatrix", () => {
    vi.mocked(useClashMatrix).mockReturnValue({
      coursesWithClashes: mockClashSet,
      loadingClashes: true,
      clashError: "",
      refetch: vi.fn(),
      uniqueClashCount: 2,
      totalStudentsAffected: 100,
      percentageStudentsAffected: 15.5,
      clashPairsMap: new Map(),
      clashCountMap: new Map(),
    });

    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.loadingClashes).toBe(true);
  });

  it("exposes clashError from useClashMatrix", () => {
    vi.mocked(useClashMatrix).mockReturnValue({
      coursesWithClashes: mockClashSet,
      loadingClashes: false,
      clashError: "Failed to fetch clashes",
      refetch: vi.fn(),
      uniqueClashCount: undefined,
      totalStudentsAffected: undefined,
      percentageStudentsAffected: undefined,
      clashPairsMap: new Map(),
      clashCountMap: new Map(),
    });

    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.clashError).toBe("Failed to fetch clashes");
  });

  it("exposes refetch function from useClashMatrix", () => {
    const mockRefetch = vi.fn();
    vi.mocked(useClashMatrix).mockReturnValue({
      coursesWithClashes: mockClashSet,
      loadingClashes: false,
      clashError: "",
      refetch: mockRefetch,
      uniqueClashCount: 2,
      totalStudentsAffected: 100,
      percentageStudentsAffected: 15.5,
      clashPairsMap: new Map(),
      clashCountMap: new Map(),
    });

    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it("exposes uniqueClashCount from useClashMatrix", () => {
    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.uniqueClashCount).toBe(2);
  });

  it("exposes totalStudentsAffected from useClashMatrix", () => {
    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.totalStudentsAffected).toBe(100);
  });

  it("exposes percentageStudentsAffected from useClashMatrix", () => {
    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.percentageStudentsAffected).toBe(15.5);
  });

  it("handles undefined metrics when loading", () => {
    vi.mocked(useClashMatrix).mockReturnValue({
      coursesWithClashes: mockClashSet,
      loadingClashes: true,
      clashError: "",
      refetch: vi.fn(),
      uniqueClashCount: undefined,
      totalStudentsAffected: undefined,
      percentageStudentsAffected: undefined,
      clashPairsMap: new Map(),
      clashCountMap: new Map(),
    });

    const { result } = renderHook(() => useCoursesWithClashes(5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.uniqueClashCount).toBeUndefined();
    expect(result.current.totalStudentsAffected).toBeUndefined();
    expect(result.current.percentageStudentsAffected).toBeUndefined();
  });

  it("updates when thresholds change", () => {
    const { rerender } = renderHook(
      ({ abs, perc }: { abs: number; perc: number }) =>
        useCoursesWithClashes(abs, perc),
      {
        wrapper: createWrapper(),
        initialProps: { abs: 5, perc: 10 },
      },
    );

    rerender({ abs: 10, perc: 20 });

    expect(useClashMatrix).toHaveBeenCalledWith(10, 20);
  });
});
