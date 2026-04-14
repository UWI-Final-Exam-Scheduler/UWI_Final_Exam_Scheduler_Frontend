import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/app/lib/courseFetch", () => ({
  courseFetch: vi.fn(),
  fetchSubjectCodes: vi.fn(),
  fetchCoursesBySubject: vi.fn(),
}));
vi.mock("@/app/lib/clashMatrixFetch", () => ({
  getClashMatrix: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));
vi.mock("@/app/hooks/usePreference", () => ({
  useUserPreferences: () => ({ data: null }),
  useUpdateUserPreferences: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@radix-ui/themes", () => ({
  Spinner: () => <span data-testid="spinner" />,
}));
vi.mock("@/app/components/ui/SubjectSelect", () => ({
  default: ({
    data,
    value,
    onChange,
    placeholder,
  }: {
    data: { value: string; label: string }[];
    value: string | null;
    onChange: (v: string | null) => void;
    placeholder: string;
  }) => (
    <select
      aria-label={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">All</option>
      {data.map((d) => (
        <option key={d.value} value={d.value}>
          {d.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock("@/app/components/ui/CourseClashFilter", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: "all" | "with" | "without") => void;
  }) => (
    <select
      aria-label="clash-filter"
      value={value}
      onChange={(e) => onChange(e.target.value as "all" | "with" | "without")}
    >
      <option value="all">All Courses</option>
      <option value="with">With Clashes</option>
      <option value="without">Without Clashes</option>
    </select>
  ),
}));
vi.mock("@/app/components/ui/CustomCard", () => ({
  default: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="course-card" className={className}>
      {children}
    </div>
  ),
}));
vi.mock("@/app/components/ui/CustomButton", () => ({
  default: ({
    buttonname,
    onclick,
    disabled,
  }: {
    buttonname: string;
    onclick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onclick} disabled={disabled}>
      {buttonname}
    </button>
  ),
}));

import CoursesPage from "@/app/(app)/courses/page";
import { useRouter, useSearchParams } from "next/navigation";
import {
  courseFetch,
  fetchSubjectCodes,
  fetchCoursesBySubject,
} from "@/app/lib/courseFetch";
import { getClashMatrix } from "@/app/lib/clashMatrixFetch";

const MOCK_COURSES = [
  {
    courseCode: "COMP3603",
    name: "Software Engineering",
    enrolledStudents: 50,
  },
  { courseCode: "COMP2611", name: "Data Structures", enrolledStudents: 80 },
  { courseCode: "MATH2150", name: "Linear Algebra", enrolledStudents: 60 },
];

const MOCK_PAGINATION = {
  page: 1,
  per_page: 20,
  total: 3,
  pages: 1,
  has_next: false,
  has_prev: false,
  courses: MOCK_COURSES,
};

const MOCK_CLASH_MATRIX = {
  conflicting_courses: [],
  courses_with_clashes: ["COMP3603"],
  total_conflicts: 1,
  unique_courses_with_conflicts: 1,
  total_students_affected: 50,
  percentage_students_affected: 12.5,
};

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

function setupNavMocks(params: Record<string, string> = {}) {
  const sp = new URLSearchParams(params);
  vi.mocked(useSearchParams).mockReturnValue({
    get: (key: string) => sp.get(key),
  } as ReturnType<typeof useSearchParams>);
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  });
}

describe("Courses page — integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupNavMocks();
    vi.mocked(courseFetch).mockResolvedValue(MOCK_PAGINATION);
    vi.mocked(fetchSubjectCodes).mockResolvedValue([
      { value: "COMP", label: "COMP" },
      { value: "MATH", label: "MATH" },
    ]);
    vi.mocked(fetchCoursesBySubject).mockResolvedValue(MOCK_PAGINATION);
    vi.mocked(getClashMatrix).mockResolvedValue(MOCK_CLASH_MATRIX);
  });

  it("renders the Courses heading", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Courses/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders one card per course after loading", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getAllByTestId("course-card")).toHaveLength(3);
    });
  });

  it("calls courseFetch(1) on initial load with no URL params", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(courseFetch).toHaveBeenCalledWith(1);
    });
  });

  it("shows subject codes in the subject dropdown", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "COMP" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "MATH" })).toBeInTheDocument();
    });
  });

  it("applies orange class to courses that have clashes", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const cards = screen.getAllByTestId("course-card");
      const orangeCards = cards.filter((c) => c.className.includes("orange"));
      expect(orangeCards).toHaveLength(1);
    });
  });

  it("applies gray class to courses without clashes", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const cards = screen.getAllByTestId("course-card");
      const grayCards = cards.filter((c) => c.className.includes("gray-200"));
      expect(grayCards).toHaveLength(2);
    });
  });

  it("calls fetchCoursesBySubject when a subject is selected", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(fetchSubjectCodes).toHaveBeenCalled());

    const subjectSelect = screen.getByRole("combobox", {
      name: /Select a subject/i,
    });
    await userEvent.selectOptions(subjectSelect, "COMP");

    await waitFor(() => {
      expect(fetchCoursesBySubject).toHaveBeenCalledWith("COMP", 1);
    });
  });

  it('shows only clashing courses when "With Clashes" is selected', async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });

    await waitFor(() =>
      expect(screen.getAllByTestId("course-card")).toHaveLength(3),
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "clash-filter" }),
      "with",
    );

    await waitFor(() => {
      const cards = screen.getAllByTestId("course-card");
      expect(cards).toHaveLength(1);
      expect(within(cards[0]).getByText("COMP3603")).toBeInTheDocument();
    });
  });

  it('shows only clean courses when "Without Clashes" is selected', async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });

    await waitFor(() =>
      expect(screen.getAllByTestId("course-card")).toHaveLength(3),
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "clash-filter" }),
      "without",
    );

    await waitFor(() => {
      const cards = screen.getAllByTestId("course-card");
      expect(cards).toHaveLength(2);
      expect(
        cards.some((card) => within(card).queryByText("COMP3603") !== null),
      ).toBe(false);
    });
  });

  it("calls fetchCoursesBySubject when subject param is in the URL", async () => {
    setupNavMocks({ subject: "MATH" });
    render(<CoursesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchCoursesBySubject).toHaveBeenCalledWith("MATH", 1);
    });
  });

  it("opens on the correct page when page param is in the URL", async () => {
    setupNavMocks({ page: "2" });
    vi.mocked(courseFetch).mockResolvedValue({ ...MOCK_PAGINATION, page: 2 });

    render(<CoursesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(courseFetch).toHaveBeenCalledWith(2);
    });
  });

  it("shows clash count from the clash matrix API in the sidebar", async () => {
    render(<CoursesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("shows empty-state message when all courses are filtered out", async () => {
    vi.mocked(getClashMatrix).mockResolvedValue({
      ...MOCK_CLASH_MATRIX,
      courses_with_clashes: ["COMP3603", "COMP2611", "MATH2150"],
    });

    render(<CoursesPage />, { wrapper: createWrapper() });

    await waitFor(() =>
      expect(screen.getAllByTestId("course-card")).toHaveLength(3),
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "clash-filter" }),
      "without",
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No courses match the selected clash filter/i),
      ).toBeInTheDocument();
    });
  });
});
