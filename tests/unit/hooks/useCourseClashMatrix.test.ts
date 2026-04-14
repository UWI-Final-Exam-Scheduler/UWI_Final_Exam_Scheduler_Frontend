import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCourseClashMatrix } from "@/app/hooks/useCourseClashMatrix";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/app/lib/courseClashFetch", () => ({
  getClashMatrixForCourse: vi.fn(),
}));

import { getClashMatrixForCourse } from "@/app/lib/courseClashFetch";

const mockClashes = [
  { course: "MATH2150", studentsClashing: 5 },
  { course: "INFO3606", studentsClashing: 3 },
];

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

describe("useCourseClashMatrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClashMatrixForCourse).mockResolvedValue(mockClashes);
  });

  it("returns empty array when no courseCode provided", async () => {
    const { result } = renderHook(() => useCourseClashMatrix("", 5, 10), {
      wrapper: createWrapper(),
    });

    expect(result.current.clashes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(getClashMatrixForCourse).not.toHaveBeenCalled();
  });

  it("fetches clashes for a valid course code", async () => {
    const { result } = renderHook(
      () => useCourseClashMatrix("COMP3603", 5, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getClashMatrixForCourse).toHaveBeenCalledWith("COMP3603", 5, 0.1);
  });

  it("returns clashes data after loading", async () => {
    const { result } = renderHook(
      () => useCourseClashMatrix("COMP3603", 5, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.clashes).toEqual(mockClashes);
    });
  });

  it("converts percentage threshold to decimal for backend", async () => {
    renderHook(() => useCourseClashMatrix("COMP3603", 5, 25), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getClashMatrixForCourse).toHaveBeenCalledWith("COMP3603", 5, 0.25);
    });
  });

  it("sets loading to true initially", () => {
    const { result } = renderHook(
      () => useCourseClashMatrix("COMP3603", 5, 10),
      { wrapper: createWrapper() },
    );

    expect(result.current.loading).toBe(true);
  });

  it("sets loading to false after data loads", async () => {
    const { result } = renderHook(
      () => useCourseClashMatrix("COMP3603", 5, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("exposes refetch function", async () => {
    const { result } = renderHook(
      () => useCourseClashMatrix("COMP3603", 5, 10),
      { wrapper: createWrapper() },
    );

    expect(typeof result.current.refetch).toBe("function");

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("refetch re-executes the query", async () => {
    const { result } = renderHook(
      () => useCourseClashMatrix("COMP3603", 5, 10),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = vi.mocked(getClashMatrixForCourse).mock.calls
      .length;

    await result.current.refetch();

    const callCountAfter = vi.mocked(getClashMatrixForCourse).mock.calls.length;

    expect(callCountAfter).toBeGreaterThan(callCountBefore);
  });

  it("updates when courseCode changes", async () => {
    const { result, rerender } = renderHook(
      ({ code }: { code: string }) => useCourseClashMatrix(code, 5, 10),
      {
        wrapper: createWrapper(),
        initialProps: { code: "COMP3603" },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(getClashMatrixForCourse).mockResolvedValue([]);

    rerender({ code: "MATH2150" });

    await waitFor(() => {
      expect(getClashMatrixForCourse).toHaveBeenCalledWith(
        "MATH2150",
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  it("updates when absoluteThreshold changes", async () => {
    const { result, rerender } = renderHook(
      ({ threshold }: { threshold: number }) =>
        useCourseClashMatrix("COMP3603", threshold, 10),
      {
        wrapper: createWrapper(),
        initialProps: { threshold: 5 },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ threshold: 10 });

    await waitFor(() => {
      expect(getClashMatrixForCourse).toHaveBeenCalledWith("COMP3603", 10, 0.1);
    });
  });

  it("updates when percentageThreshold changes", async () => {
    const { result, rerender } = renderHook(
      ({ threshold }: { threshold: number }) =>
        useCourseClashMatrix("COMP3603", 5, threshold),
      {
        wrapper: createWrapper(),
        initialProps: { threshold: 10 },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ threshold: 20 });

    await waitFor(() => {
      expect(getClashMatrixForCourse).toHaveBeenCalledWith("COMP3603", 5, 0.2);
    });
  });
});
