import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useClashMatrix } from "@/app/hooks/useClashMatrix";
import React from "react";

vi.mock("@/app/lib/clashMatrixFetch", () => ({
  getClashMatrix: vi.fn(() =>
    Promise.resolve({
      conflicting_courses: [
        { course1: "COMP1601", course2: "MATH1115", clash_count: 12 },
        { course1: "COMP1601", course2: "PHYS2156", clash_count: 5 },
        { course1: "MATH1115", course2: "CHEM1401", clash_count: 8 },
      ],
      courses_with_clashes: ["COMP1601", "MATH1115", "PHYS2156", "CHEM1401"],
      total_conflicts: 3,
      unique_courses_with_conflicts: 4,
      total_students_affected: 25,
      percentage_students_affected: 15,
    }),
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return Wrapper;
};

describe("useClashMatrix", () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it("should return clashPairsMap with course pairs and counts", async () => {
    const { result } = renderHook(() => useClashMatrix(0, 0), { wrapper });

    await waitFor(() => {
      expect(result.current.clashPairsMap.size).toBeGreaterThan(0);
    });

    expect(result.current.clashPairsMap.get("COMP1601")?.get("MATH1115")).toBe(
      12,
    );
    expect(result.current.clashPairsMap.get("COMP1601")?.get("PHYS2156")).toBe(
      5,
    );
  });

  it("should build bidirectional pairs (A→B and B→A)", async () => {
    const { result } = renderHook(() => useClashMatrix(0, 0), { wrapper });

    await waitFor(() => {
      expect(result.current.clashPairsMap.size).toBeGreaterThan(0);
    });

    const comp = result.current.clashPairsMap.get("COMP1601");
    const math = result.current.clashPairsMap.get("MATH1115");
    expect(comp?.get("MATH1115")).toBe(math?.get("COMP1601"));
  });

  it("should list all courses with clashes", async () => {
    const { result } = renderHook(() => useClashMatrix(0, 0), { wrapper });

    await waitFor(() => {
      expect(result.current.coursesWithClashes.size).toBeGreaterThan(0);
    });

    expect(result.current.coursesWithClashes.has("COMP1601")).toBe(true);
    expect(result.current.coursesWithClashes.has("MATH1115")).toBe(true);
  });

  it("should return total students affected", async () => {
    const { result } = renderHook(() => useClashMatrix(0, 0), { wrapper });

    await waitFor(() => {
      expect(result.current.totalStudentsAffected).toBeDefined();
    });

    expect(result.current.totalStudentsAffected).toBe(25);
  });

  it("should return unique clash count", async () => {
    const { result } = renderHook(() => useClashMatrix(0, 0), { wrapper });

    await waitFor(() => {
      expect(result.current.uniqueClashCount).toBeDefined();
    });

    expect(result.current.uniqueClashCount).toBe(4);
  });
});
