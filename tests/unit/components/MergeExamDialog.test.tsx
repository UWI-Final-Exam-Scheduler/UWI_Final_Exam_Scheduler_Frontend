import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MergeExamDialog from "@/app/components/ui/MergeExamDialog";
import { mockExam } from "../mocks/examMockData";
import { mockVenues } from "../mocks/venueMockData";

const split1 = mockExam({ id: 1, number_of_students: 50, venue_id: 1 });
const split2 = mockExam({ id: 2, number_of_students: 50, venue_id: 1 });
const split3 = mockExam({ id: 3, number_of_students: 30, venue_id: 2 });

const defaultProps = {
  exam: mockExam({ number_of_students: 100, timeColumnId: "9" }),
  splits: [split1, split2],
  open: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  venues: mockVenues(),
};

describe("MergeExamDialog", () => {
  it("should display the course code in the title", () => {
    render(<MergeExamDialog {...defaultProps} />);
    expect(screen.getByText(/Merge COMP1601 Splits/i)).toBeInTheDocument();
  });

  it("should show simple message for 2 splits", () => {
    render(<MergeExamDialog {...defaultProps} />);
    expect(screen.getByText(/Merge both splits/i)).toBeInTheDocument();
  });

  it("should show checkboxes for 3+ splits", () => {
    render(
      <MergeExamDialog {...defaultProps} splits={[split1, split2, split3]} />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("should show combined total students", () => {
    render(<MergeExamDialog {...defaultProps} />);
    expect(screen.getByText("100")).toBeInTheDocument(); // 50 + 50
  });

  it("should start with confirm button enabled (all splits selected)", () => {
    render(<MergeExamDialog {...defaultProps} />);
    const confirmBtn = screen.getByRole("button", { name: /confirm merge/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("should disable confirm when fewer than 2 splits selected", async () => {
    const user = userEvent.setup();
    render(
      <MergeExamDialog {...defaultProps} splits={[split1, split2, split3]} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // deselect split 1
    await user.click(checkboxes[1]); // deselect split 2
    // only split3 selected now

    const confirmBtn = screen.getByRole("button", { name: /confirm merge/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("should call onConfirm with selected exam IDs", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<MergeExamDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: /confirm merge/i }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      false, // wouldExceed = false (100 students, 100 capacity)
    );
  });

  it("should show capacity overflow warning when merge exceeds venue capacity", () => {
    const smallVenue = [
      { id: 1, name: "Engineering Building A101", capacity: 80 },
    ];
    render(
      <MergeExamDialog
        {...defaultProps}
        splits={[split1, split2, split3]}
        venues={smallVenue}
      />,
    );

    expect(screen.getByText(/Capacity Overflow/i)).toBeInTheDocument();
  });

  it('should change confirm label to "Merge & Move to Reschedule" on overflow', () => {
    const smallVenue = [
      { id: 1, name: "Engineering Building A101", capacity: 80 },
    ];
    render(
      <MergeExamDialog
        {...defaultProps}
        splits={[split1, split2, split3]}
        venues={smallVenue}
      />,
    );

    expect(
      screen.getByRole("button", { name: /merge & move to reschedule/i }),
    ).toBeInTheDocument();
  });

  it("should call onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<MergeExamDialog {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("should return null when exam is null", () => {
    const { container } = render(
      <MergeExamDialog {...defaultProps} exam={null} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
