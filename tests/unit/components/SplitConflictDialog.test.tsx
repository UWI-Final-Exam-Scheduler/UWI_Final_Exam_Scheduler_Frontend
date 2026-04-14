import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SplitConflictDialog from "@/app/components/ui/SplitConflictDialog";

const defaultProps = {
  open: true,
  courseCode: "COMP1601",
  onDismiss: vi.fn(),
};

describe("SplitConflictDialog", () => {
  it('should display the title "Invalid Split Scheduling"', () => {
    render(<SplitConflictDialog {...defaultProps} />);

    expect(screen.getByText("Invalid Split Scheduling")).toBeInTheDocument();
  });

  it("should display the course code", () => {
    render(<SplitConflictDialog {...defaultProps} />);

    expect(screen.getByText("COMP1601")).toBeInTheDocument();
  });

  it('should show the "same day and time" rule message', () => {
    render(<SplitConflictDialog {...defaultProps} />);

    expect(screen.getByText(/same day and time/i)).toBeInTheDocument();
  });

  it("should show existing date and time when both are provided", () => {
    render(
      <SplitConflictDialog
        {...defaultProps}
        existingDate="2025-05-12"
        existingTime={9}
      />,
    );

    expect(screen.getByText(/2025-05-12/)).toBeInTheDocument();
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
  });

  it("should pad single-digit time with leading zero", () => {
    render(
      <SplitConflictDialog
        {...defaultProps}
        existingDate="2025-05-12"
        existingTime={9}
      />,
    );

    // time 9 → "09:00" not "9:00"
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
  });

  it("should show generic message when existingDate and existingTime are not provided", () => {
    render(<SplitConflictDialog {...defaultProps} />);

    expect(
      screen.getByText(/splits scheduled on different times/i),
    ).toBeInTheDocument();
  });

  it("should show generic message when only one of date/time is provided", () => {
    render(
      <SplitConflictDialog
        {...defaultProps}
        existingDate="2025-05-12"
        // existingTime intentionally omitted
      />,
    );

    expect(
      screen.getByText(/splits scheduled on different times/i),
    ).toBeInTheDocument();
  });

  it('should call onDismiss when "Got it" is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<SplitConflictDialog {...defaultProps} onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: /got it/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should not render when open is false", () => {
    render(<SplitConflictDialog {...defaultProps} open={false} />);

    expect(
      screen.queryByText("Invalid Split Scheduling"),
    ).not.toBeInTheDocument();
  });
});
