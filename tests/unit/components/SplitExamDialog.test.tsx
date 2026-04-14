import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SplitExamDialog from "@/app/components/ui/SplitExamDialog";
import { mockExam } from "../mocks/examMockData";

const defaultProps = {
  exam: mockExam({ number_of_students: 100 }),
  open: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("SplitExamDialog", () => {
  it("should display the course code in the title", () => {
    render(<SplitExamDialog {...defaultProps} />);
    expect(screen.getByText(/Split COMP1601/i)).toBeInTheDocument();
  });

  it("should display total student count", () => {
    render(<SplitExamDialog {...defaultProps} />);
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
    const hundredValues = screen.getAllByText("100");
    expect(hundredValues.length).toBeGreaterThan(0);
  });

  it("should start with 2 split inputs", () => {
    render(<SplitExamDialog {...defaultProps} />);

    expect(screen.getByText("Split 1")).toBeInTheDocument();
    expect(screen.getByText("Split 2")).toBeInTheDocument();
    expect(screen.queryByText("Split 3")).not.toBeInTheDocument();
  });

  it("should disable confirm when splits do not sum to total", () => {
    render(<SplitExamDialog {...defaultProps} />);

    const confirmBtn = screen.getByRole("button", { name: /confirm split/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("should enable confirm when splits sum exactly to total", async () => {
    const user = userEvent.setup();
    render(<SplitExamDialog {...defaultProps} />);

    const inputs = screen.getAllByPlaceholderText("Students");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "60");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "40");

    const confirmBtn = screen.getByRole("button", { name: /confirm split/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("should show negative remaining when over-allocated", async () => {
    const user = userEvent.setup();
    render(<SplitExamDialog {...defaultProps} />);

    const inputs = screen.getAllByPlaceholderText("Students");
    await user.type(inputs[0], "80");
    await user.type(inputs[1], "40");

    const negativeRemaining = screen.getByText("-20");
    expect(negativeRemaining).toBeInTheDocument();
  });

  it('should add a third split when "+ Add Split" is clicked', async () => {
    const user = userEvent.setup();
    render(<SplitExamDialog {...defaultProps} />);

    await user.click(screen.getByText("+ Add Split"));

    expect(screen.getByText("Split 3")).toBeInTheDocument();
  });

  it("should show Remove button when more than 2 splits exist", async () => {
    const user = userEvent.setup();
    render(<SplitExamDialog {...defaultProps} />);

    await user.click(screen.getByText("+ Add Split"));

    expect(screen.getAllByText("Remove")).toHaveLength(3);
  });

  it("should not show Remove button with exactly 2 splits", () => {
    render(<SplitExamDialog {...defaultProps} />);
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it('should hide "+ Add Split" when at max splits', async () => {
    const user = userEvent.setup();
    render(<SplitExamDialog {...defaultProps} existingSplitCount={2} />);

    // Already at 2 existing + 2 new = 4 total, button should be hidden
    expect(screen.queryByText("+ Add Split")).not.toBeInTheDocument();
  });

  it("should show max splits warning when limit reached", async () => {
    render(<SplitExamDialog {...defaultProps} existingSplitCount={2} />);

    expect(screen.getByText(/Maximum 3 splits reached/i)).toBeInTheDocument();
  });

  it("should call onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SplitExamDialog {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("should call onConfirm with split data when confirmed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<SplitExamDialog {...defaultProps} onConfirm={onConfirm} />);

    const inputs = screen.getAllByPlaceholderText("Students");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "60");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "40");

    await user.click(screen.getByRole("button", { name: /confirm split/i }));

    expect(onConfirm).toHaveBeenCalledWith([
      { number_of_students: 60 },
      { number_of_students: 40 },
    ]);
  });

  it("should return null when exam is null", () => {
    const { container } = render(
      <SplitExamDialog {...defaultProps} exam={null} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
