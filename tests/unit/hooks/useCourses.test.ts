import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCourses } from "@/app/hooks/useCourses";

vi.mock("@/app/lib/courseFetch", () => ({
  courseFetch: vi.fn(),
  fetchSubjectCodes: vi.fn(),
  fetchCoursesBySubject: vi.fn(),
}));

import {
  courseFetch,
  fetchSubjectCodes,
  fetchCoursesBySubject,
} from "@/app/lib/courseFetch";

const mockCourses = [
  {
    courseCode: "COMP3603",
    name: "Software Engineering",
    enrolledStudents: 50,
  },
  { courseCode: "COMP2611", name: "Data Structures", enrolledStudents: 80 },
];

const mockResponse = {
  page: 1,
  per_page: 20,
  total: 2,
  pages: 1,
  has_next: false,
  has_prev: false,
  courses: mockCourses,
};

const mockSubjectCodes = [
  { value: "COMP", label: "COMP" },
  { value: "MATH", label: "MATH" },
];

describe("useCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseFetch).mockResolvedValue(mockResponse);
    vi.mocked(fetchSubjectCodes).mockResolvedValue(mockSubjectCodes);
    vi.mocked(fetchCoursesBySubject).mockResolvedValue(mockResponse);
  });

  it("fetches subject codes on mount", async () => {
    renderHook(() => useCourses());

    await waitFor(() => {
      expect(fetchSubjectCodes).toHaveBeenCalled();
    });
  });

  it("returns subject codes after fetching", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.subjectCodes).toEqual(mockSubjectCodes);
    });
  });

  it("fetches all courses when no subject is provided", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(courseFetch).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(result.current.displayedCourses).toEqual(mockCourses);
    });
  });

  it("starts on page 1 by default", async () => {
    const { result } = renderHook(() => useCourses());

    expect(result.current.page).toBe(1);

    await waitFor(() => {
      expect(result.current.displayedCourses).toEqual(mockCourses);
    });
  });

  it("respects initialPage parameter", async () => {
    const { result } = renderHook(() => useCourses(null, 3));

    await waitFor(() => {
      expect(courseFetch).toHaveBeenCalledWith(3);
    });

    expect(result.current.page).toBe(3);
  });

  it("respects initialSubject parameter", async () => {
    const { result } = renderHook(() => useCourses("COMP"));

    await waitFor(() => {
      expect(fetchCoursesBySubject).toHaveBeenCalledWith("COMP", 1);
    });

    await waitFor(() => {
      expect(result.current.displayedCourses).toEqual(mockCourses);
    });
  });

  it("sets isLoading to false after fetch", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("returns pagination response", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.paginationResponse).toEqual(mockResponse);
    });
  });

  it("updates courses when page changes", async () => {
    vi.mocked(courseFetch).mockResolvedValue({
      ...mockResponse,
      page: 2,
      courses: [
        {
          courseCode: "MATH2150",
          name: "Linear Algebra",
          enrolledStudents: 60,
        },
      ],
    });

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(courseFetch).toHaveBeenCalledWith(2);
    });
  });

  it("handleFilterChange updates selected subject and resets to page 1", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleFilterChange("MATH");
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(fetchCoursesBySubject).toHaveBeenCalledWith("MATH", 1);
    });
  });

  it("handleFilterChange with null clears subject filter", async () => {
    const { result } = renderHook(() => useCourses("COMP"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleFilterChange(null);
    });

    await waitFor(() => {
      expect(courseFetch).toHaveBeenCalledWith(1);
    });
  });

  it("sets error when fetch fails", async () => {
    vi.mocked(courseFetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });
  });

  it("sets generic error message for non-Error throws", async () => {
    vi.mocked(courseFetch).mockRejectedValue("Unknown error");

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.error).toBe("Error fetching courses");
    });
  });

  it("clears error on successful fetch", async () => {
    vi.mocked(courseFetch)
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.error).toBe("First error");
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(result.current.error).toBe("");
    });
  });

  it("handles subject change error", async () => {
    // Keep courses request pending so it cannot clear error state to "".
    vi.mocked(courseFetch).mockImplementation(
      () => new Promise(() => {}) as Promise<never>,
    );
    vi.mocked(fetchSubjectCodes).mockRejectedValue(
      new Error("Failed to fetch subjects"),
    );

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch subjects");
    });
  });
});
