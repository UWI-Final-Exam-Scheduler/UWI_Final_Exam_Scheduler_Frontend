import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCoursesWithClashes } from "@/app/hooks/useCoursesWithClashes";

vi.mock("@/app/hooks/useClashMatrix", () => ({
  useClashMatrix: vi.fn(),
}));

import { useClashMatrix } from "@/app/hooks/useClashMatrix";

const mockClashSet = new Set(["COMP3603", "MATH2150"]);
const mockRefetch = vi.fn();

describe("useCoursesWithClashes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("maps useClashMatrix result to courseClashesSet", () => {
    const { result } = renderHook(() => useCoursesWithClashes(5, 10));

    expect(result.current.courseClashesSet).toBe(mockClashSet);
    expect(result.current.uniqueClashCount).toBe(2);
    expect(result.current.totalStudentsAffected).toBe(100);
    expect(result.current.percentageStudentsAffected).toBe(15.5);
  });

  it("passes through loading and error state", () => {
    vi.mocked(useClashMatrix).mockReturnValue({
      coursesWithClashes: mockClashSet,
      loadingClashes: true,
      clashError: "Failed to fetch clashes",
      refetch: mockRefetch,
      uniqueClashCount: undefined,
      totalStudentsAffected: undefined,
      percentageStudentsAffected: undefined,
      clashPairsMap: new Map(),
      clashCountMap: new Map(),
    });

    const { result } = renderHook(() => useCoursesWithClashes(5, 10));

    expect(result.current.loadingClashes).toBe(true);
    expect(result.current.clashError).toBe("Failed to fetch clashes");
  });

  it("exposes refetch from useClashMatrix", () => {
    const { result } = renderHook(() => useCoursesWithClashes(5, 10));

    expect(result.current.refetch).toBe(mockRefetch);
  });
});
