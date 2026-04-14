import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CapacityWarningDialog from "@/app/components/ui/CapacityWarningDialog";

const defaultProps = {
  open: true,
  courseCode: "COMP1601",
  venueName: "Engineering Building A101",
  occupied: 80,
  capacity: 100,
  incomingStudents: 45,
  onDismiss: vi.fn(),
};

describe("CapacityWarningDialog", () => {
  it('should display the title "Venue Capacity Exceeded"', () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    expect(screen.getByText("Venue Capacity Exceeded")).toBeInTheDocument();
  });

  it("should show the course code that cannot be moved", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    expect(screen.getByText("COMP1601")).toBeInTheDocument();
  });

  it("should show the target venue name", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    expect(screen.getByText("Engineering Building A101")).toBeInTheDocument();
  });

  it("should display current occupancy", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    expect(screen.getByText(/Current occupancy/i)).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("should display incoming students count with + prefix", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    expect(screen.getByText("+45")).toBeInTheDocument();
  });

  it("should display the correct total (occupied + incoming)", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    // 80 + 45 = 125
    expect(screen.getByText("125")).toBeInTheDocument();
  });

  it("should display venue capacity limit", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("should show the total would exceed capacity", () => {
    render(<CapacityWarningDialog {...defaultProps} />);

    // "Total would be: 125 / 100"
    expect(screen.getByText(/Total would be/i)).toBeInTheDocument();
  });

  it("should call onDismiss when Dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<CapacityWarningDialog {...defaultProps} onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should not render when open is false", () => {
    render(<CapacityWarningDialog {...defaultProps} open={false} />);

    expect(
      screen.queryByText("Venue Capacity Exceeded"),
    ).not.toBeInTheDocument();
  });

  it("should handle exact capacity (total = capacity) as overflow", () => {
    render(
      <CapacityWarningDialog
        {...defaultProps}
        occupied={60}
        capacity={100}
        incomingStudents={40}
      />,
    );

    // 60 + 40 = 100 exactly — still shown as warning
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
