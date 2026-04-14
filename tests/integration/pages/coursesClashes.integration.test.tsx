import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── mock only the network and navigation boundaries ───────────────────────
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));
vi.mock("@/app/lib/courseClashFetch", () => ({
  getClashMatrixForCourse: vi.fn(),
}));
vi.mock("@radix-ui/themes", () => ({
  Spinner: () => <span data-testid="spinner" />,
}));
vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span>←</span>,
}));
// Thresholds come from Zustand (in-memory) — no mock needed for the store itself
// useUserPreferences calls the backend; mock its hook to avoid a network call
vi.mock("@/app/hooks/usePreference", () => ({
  useUserPreferences: () => ({ data: null }),
  useUpdateUserPreferences: () => ({ mutateAsync: vi.fn() }),
}));

import CourseClashMatrixPage from "@/app/(app)/course-clashes/page";
import { useRouter, useSearchParams } from "next/navigation";
import { getClashMatrixForCourse } from "@/app/lib/courseClashFetch";

type Clash = { course: string; studentsClashing: number };

function buildSearchParams(params: Record<string, string>) {
  const sp = new URLSearchParams(params);
  return { get: (key: string) => sp.get(key) } as ReturnType<
    typeof useSearchParams
  >;
}

function createWrapper() {
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
}

describe("CourseClashes page — integration", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    });
    vi.mocked(useSearchParams).mockReturnValue(
      buildSearchParams({ courseCode: "COMP3603", enrolledStudents: "50" }),
    );
    vi.mocked(getClashMatrixForCourse).mockResolvedValue([]);
  });

  // ── rendering ─────────────────────────────────────────────────────────────
  it("renders the course code in the page heading", () => {
    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/Clash Matrix for COMP3603/i)).toBeInTheDocument();
  });

  it("renders the Back to Courses button", () => {
    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /Back to Courses/i }),
    ).toBeInTheDocument();
  });

  // ── loading state ─────────────────────────────────────────────────────────
  it("shows loading spinner while clash data is being fetched", () => {
    vi.mocked(getClashMatrixForCourse).mockReturnValue(new Promise(() => {}));
    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.getByText(/Loading clashes/i)).toBeInTheDocument();
  });

  // ── clash data ────────────────────────────────────────────────────────────
  it("renders clash rows after data loads", async () => {
    const clashes: Clash[] = [
      { course: "MATH2150", studentsClashing: 12 },
      { course: "INFO3606", studentsClashing: 5 },
    ];
    vi.mocked(getClashMatrixForCourse).mockResolvedValue(clashes);

    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("MATH2150")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("INFO3606")).toBeInTheDocument();
    });
  });

  it('shows "No clashes found" when the API returns an empty array', async () => {
    vi.mocked(getClashMatrixForCourse).mockResolvedValue([]);

    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No clashes found.")).toBeInTheDocument();
    });
  });

  it("passes enrolled students count to the matrix component", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      buildSearchParams({ courseCode: "COMP3603", enrolledStudents: "75" }),
    );
    vi.mocked(getClashMatrixForCourse).mockResolvedValue([]);

    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/75/)).toBeInTheDocument();
    });
  });

  // ── back navigation ───────────────────────────────────────────────────────
  it("navigates back to /courses when Back is clicked with no filters", () => {
    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /Back to Courses/i }));
    expect(mockPush).toHaveBeenCalledWith("/courses");
  });

  it("preserves subject and page filters in the back URL", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      buildSearchParams({
        courseCode: "COMP3603",
        enrolledStudents: "50",
        subject: "COMP",
        page: "2",
      }),
    );

    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /Back to Courses/i }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("subject=COMP"),
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  it("preserves clashFilter in the back URL", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      buildSearchParams({
        courseCode: "COMP3603",
        enrolledStudents: "50",
        clashFilter: "with",
      }),
    );

    render(<CourseClashMatrixPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /Back to Courses/i }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("clashFilter=with"),
    );
  });
});
