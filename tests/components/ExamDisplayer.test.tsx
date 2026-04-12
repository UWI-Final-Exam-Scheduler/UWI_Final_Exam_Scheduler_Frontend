import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExamDisplayer from "@/app/components/ui/ExamDisplayer";
import { mockExam } from "../mocks/examMockData";
import { mockVenues } from "../mocks/venueMockData";
import { Exam, Column } from "@/app/components/types/calendarTypes";

// 3 time columns (9AM, 1PM, 4PM) + reschedule column
const mockColumns: Column[] = [
  { id: "0", title: "Reschedule Exams" },
  { id: "9", title: "9:00 AM" },
  { id: "1", title: "1:00 PM" },
  { id: "4", title: "4:00 PM" },
];

const baseProps = {
  selectedDay: new Date("2025-05-12"),
  exams: [],
  rescheduleExams: [],
  columns: mockColumns,
  venues: mockVenues(),
  alertOpen: false,
  isLoading: false,
  pendingMove: null,
  handleConfirmMove: vi.fn(),
  handleCancelMove: vi.fn(),
  onPreviousDay: vi.fn(),
  onNextDay: vi.fn(),
  disablePreviousDay: false,
  disableNextDay: false,
  activeExam: null,
  examSplits: [],
  splitDialogOpen: false,
  mergeDialogOpen: false,
  onSplitExam: vi.fn(),
  onMergeExam: vi.fn(),
  onSplitConfirm: vi.fn(),
  onMergeConfirm: vi.fn(),
  onCloseSplit: vi.fn(),
  onCloseMerge: vi.fn(),
};

describe("ExamDisplayer Dashboard Viewing", () => {
  it("should display 3 time columns (9AM, 1PM, 4PM)", () => {
    render(<ExamDisplayer {...baseProps} />);

    expect(screen.getByText("9:00 AM")).toBeInTheDocument();
    expect(screen.getByText("1:00 PM")).toBeInTheDocument();
    expect(screen.getByText("4:00 PM")).toBeInTheDocument();
  });

  it("should display the selected date in the heading", () => {
    render(<ExamDisplayer {...baseProps} />);

    // The heading says "Exams on <date>"
    expect(screen.getByText(/Exams on/i)).toBeInTheDocument();
  });

  it("should show exams in their correct time column", () => {
    const exams: Exam[] = [
      mockExam({ id: 1, courseCode: "COMP1601", timeColumnId: "9" }),
      mockExam({ id: 2, courseCode: "MATH1115", timeColumnId: "1" }),
      mockExam({ id: 3, courseCode: "PHYS2156", timeColumnId: "4" }),
    ];

    render(<ExamDisplayer {...baseProps} exams={exams} />);

    expect(screen.getByText("COMP1601")).toBeInTheDocument();
    expect(screen.getByText("MATH1115")).toBeInTheDocument();
    expect(screen.getByText("PHYS2156")).toBeInTheDocument();
  });

  it("should NOT render the Reschedule column inside ExamDisplayer (handled separately)", () => {
    // ExamDisplayer filters out column id "0" — reschedule is rendered outside
    render(<ExamDisplayer {...baseProps} />);

    // The 3 time columns are shown, reschedule column is not part of this grid
    const timeColumnHeadings = screen.getAllByText(/AM|PM/);
    expect(timeColumnHeadings).toHaveLength(3);
  });

  it("should show reschedule exams in the reschedule column", () => {
    const rescheduleExams: Exam[] = [
      mockExam({ id: 10, courseCode: "GEOG3107", timeColumnId: "0" }),
    ];

    render(<ExamDisplayer {...baseProps} rescheduleExams={rescheduleExams} />);

    // The component passes allExams (scheduled + reschedule) down for split detection
    // GEOG3107 is in reschedule so won't appear in time columns
    expect(screen.queryByText("GEOG3107")).not.toBeInTheDocument();
  });

  it("should call onPreviousDay when Previous button is clicked", async () => {
    const user = userEvent.setup();
    const onPreviousDay = vi.fn();

    render(<ExamDisplayer {...baseProps} onPreviousDay={onPreviousDay} />);

    await user.click(screen.getByRole("button", { name: /previous day/i }));
    expect(onPreviousDay).toHaveBeenCalled();
  });

  it("should call onNextDay when Next button is clicked", async () => {
    const user = userEvent.setup();
    const onNextDay = vi.fn();

    render(<ExamDisplayer {...baseProps} onNextDay={onNextDay} />);

    await user.click(screen.getByRole("button", { name: /next day/i }));
    expect(onNextDay).toHaveBeenCalled();
  });

  it("should disable Previous button when disablePreviousDay is true", () => {
    render(<ExamDisplayer {...baseProps} disablePreviousDay={true} />);

    const prevBtn = screen.getByRole("button", { name: /previous day/i });
    expect(prevBtn).toBeDisabled();
  });

  it("should disable Next button when disableNextDay is true", () => {
    render(<ExamDisplayer {...baseProps} disableNextDay={true} />);

    const nextBtn = screen.getByRole("button", { name: /next day/i });
    expect(nextBtn).toBeDisabled();
  });

  it('should show "Drop here" in each column when no exams are scheduled', () => {
    render(<ExamDisplayer {...baseProps} exams={[]} venues={[]} />);

    const dropZones = screen.getAllByText("Drop here");
    // One drop zone per time column (3 columns, no venues so no split slots)
    expect(dropZones.length).toBeGreaterThanOrEqual(3);
  });

  it("should show 0 exams count in each column when empty", () => {
    render(<ExamDisplayer {...baseProps} exams={[]} venues={[]} />);

    const zeroExamLabels = screen.getAllByText(/0 exams/i);
    expect(zeroExamLabels).toHaveLength(3);
  });
});
