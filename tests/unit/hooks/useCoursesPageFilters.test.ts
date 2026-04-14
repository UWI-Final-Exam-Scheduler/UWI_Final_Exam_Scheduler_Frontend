import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCoursesPageFilters } from "@/app/hooks/useCoursesPageFilters";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockCourses = [
  {
    courseCode: "COMP3603",
    name: "Software Engineering",
    enrolledStudents: 50,
  },
  { courseCode: "COMP2611", name: "Data Structures", enrolledStudents: 80 },
  { courseCode: "MATH2150", name: "Linear Algebra", enrolledStudents: 60 },
  { courseCode: "INFO3606", name: "Cloud Computing", enrolledStudents: 40 },
];

// COMP3603 and MATH2150 clash
const mockClashSet = new Set(["COMP3603", "MATH2150"]);

const baseArgs = {
  displayedCourses: mockCourses,
  coursesWithClashes: mockClashSet,
  page: 1,
  setPage: vi.fn(),
  handleFilterChange: vi.fn(),
  initialSubject: null,
  initialCourseCode: null,
  initialClashFilter: "all" as const,
};

describe("useCoursesPageFilters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all courses when no filter is applied", () => {
    const { result } = renderHook(() => useCoursesPageFilters(baseArgs));
    expect(result.current.filteredCourses).toHaveLength(4);
  });

  it('filters to only courses with clashes when clashFilter is "with"', () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialClashFilter: "with" }),
    );
    const codes = result.current.filteredCourses.map((c) => c.courseCode);
    expect(codes).toEqual(expect.arrayContaining(["COMP3603", "MATH2150"]));
    expect(codes).not.toContain("COMP2611");
    expect(codes).not.toContain("INFO3606");
    expect(result.current.filteredCourses).toHaveLength(2);
  });

  it('filters to only courses without clashes when clashFilter is "without"', () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialClashFilter: "without" }),
    );
    const codes = result.current.filteredCourses.map((c) => c.courseCode);
    expect(codes).toEqual(expect.arrayContaining(["COMP2611", "INFO3606"]));
    expect(codes).not.toContain("COMP3603");
    expect(codes).not.toContain("MATH2150");
    expect(result.current.filteredCourses).toHaveLength(2);
  });

  it("shows only one course when a course code filter is applied", () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialCourseCode: "COMP3603" }),
    );
    expect(result.current.filteredCourses).toHaveLength(1);
    expect(result.current.filteredCourses[0].courseCode).toBe("COMP3603");
  });

  it("normalises the course code comparison (case-insensitive)", () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialCourseCode: "comp3603" }),
    );
    expect(result.current.filteredCourses).toHaveLength(1);
    expect(result.current.filteredCourses[0].courseCode).toBe("COMP3603");
  });

  it("calls handleFilterChange and clears course code when subject changes", () => {
    const mockSetPage = vi.fn();
    const mockHandleFilterChange = vi.fn();
    const { result } = renderHook(() =>
      useCoursesPageFilters({
        ...baseArgs,
        setPage: mockSetPage,
        handleFilterChange: mockHandleFilterChange,
      }),
    );

    act(() => {
      result.current.onSubjectChange("COMP");
    });

    expect(mockHandleFilterChange).toHaveBeenCalledWith("COMP");
    expect(result.current.selectedSubject).toBe("COMP");
    expect(result.current.selectedCourseCode).toBeNull();
  });

  it("calls handleFilterChange with null when subject is cleared", () => {
    const mockHandleFilterChange = vi.fn();
    const { result } = renderHook(() =>
      useCoursesPageFilters({
        ...baseArgs,
        initialSubject: "COMP",
        handleFilterChange: mockHandleFilterChange,
      }),
    );

    act(() => {
      result.current.onSubjectChange(null);
    });

    expect(mockHandleFilterChange).toHaveBeenCalledWith(null);
    expect(result.current.selectedSubject).toBeNull();
  });

  it("resets to page 1 when a course code filter is applied", () => {
    const mockSetPage = vi.fn();
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, page: 3, setPage: mockSetPage }),
    );

    act(() => {
      result.current.onCourseCodeChange("COMP3603");
    });

    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  it("initialises selectedSubject from initialSubject", () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialSubject: "COMP" }),
    );
    expect(result.current.selectedSubject).toBe("COMP");
  });

  it("initialises selectedCourseCode from initialCourseCode", () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialCourseCode: "COMP3603" }),
    );
    expect(result.current.selectedCourseCode).toBe("COMP3603");
  });

  it("initialises clashFilter from initialClashFilter", () => {
    const { result } = renderHook(() =>
      useCoursesPageFilters({ ...baseArgs, initialClashFilter: "with" }),
    );
    expect(result.current.clashFilter).toBe("with");
  });

  // Course code dropdown options
  it("builds sorted courseCodeOptions from displayed courses", () => {
    const { result } = renderHook(() => useCoursesPageFilters(baseArgs));
    const values = result.current.courseCodeOptions.map((o) => o.value);
    expect(values).toContain("COMP3603");
    expect(values).toContain("COMP2611");
    expect(values).toContain("MATH2150");
    expect(values).toContain("INFO3606");
    // Must be lexicographically sorted
    expect(values).toEqual([...values].sort());
  });

  it("deduplicates course codes in the options list", () => {
    const duplicatedCourses = [...mockCourses, mockCourses[0]]; // COMP3603 twice
    const { result } = renderHook(() =>
      useCoursesPageFilters({
        ...baseArgs,
        displayedCourses: duplicatedCourses,
      }),
    );
    const comp3603Options = result.current.courseCodeOptions.filter(
      (o) => o.value === "COMP3603",
    );
    expect(comp3603Options).toHaveLength(1);
  });

  // Clash filter state updates
  it("updates clashFilter when onClashFilterChange is called", () => {
    const { result } = renderHook(() => useCoursesPageFilters(baseArgs));
    act(() => {
      result.current.onClashFilterChange("without");
    });
    expect(result.current.clashFilter).toBe("without");
  });
});
