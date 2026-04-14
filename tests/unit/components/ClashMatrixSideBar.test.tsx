import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClashMatrixSidebar from "@/app/components/ui/ClashMatrixSidebar";

vi.mock("@radix-ui/themes", () => ({
  Spinner: () => <span data-testid="spinner" />,
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

describe("ClashMatrixSidebar", () => {
  it('renders the "Clash Metrics" heading', () => {
    render(<ClashMatrixSidebar />);
    expect(screen.getByText("Clash Metrics")).toBeInTheDocument();
  });

  it("shows the clash count when provided", () => {
    render(<ClashMatrixSidebar clashCount={12} totalCourses={100} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows a spinner when clashCount is undefined (still loading)", () => {
    render(<ClashMatrixSidebar clashCount={undefined} />);
    expect(screen.getAllByTestId("spinner").length).toBeGreaterThan(0);
  });

  it("shows students affected count and percentage", () => {
    render(
      <ClashMatrixSidebar
        clashCount={5}
        affectedStudentsCount={200}
        affectedStudentsPercentage={15.5}
      />,
    );
    expect(screen.getByText(/200/)).toBeInTheDocument();
    expect(screen.getByText(/15\.50/)).toBeInTheDocument();
  });

  it("shows a spinner for students affected when count is undefined", () => {
    render(
      <ClashMatrixSidebar
        clashCount={5}
        affectedStudentsCount={undefined}
        affectedStudentsPercentage={undefined}
      />,
    );
    expect(screen.getAllByTestId("spinner").length).toBeGreaterThan(0);
  });

  it("displays the total courses count", () => {
    render(<ClashMatrixSidebar totalCourses={150} />);
    expect(screen.getByText(/Total Courses: 150/)).toBeInTheDocument();
  });

  it("renders the percentage threshold slider with the correct value", () => {
    render(<ClashMatrixSidebar percentageThreshold={20} />);
    expect(screen.getByText(/Percentage Threshold: 20%/)).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveValue("20");
  });

  it("calls onPercentageChange when the slider is moved", () => {
    const mockChange = vi.fn();
    render(
      <ClashMatrixSidebar
        percentageThreshold={10}
        onPercentageChange={mockChange}
      />,
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "20" } });
    expect(mockChange).toHaveBeenCalledWith(20);
  });

  it("renders the absolute threshold number input with the correct value", () => {
    render(<ClashMatrixSidebar absoluteThreshold="10" />);
    expect(screen.getByRole("spinbutton")).toHaveValue(10);
  });

  it("calls onAbsoluteChange when the input value changes", () => {
    const mockChange = vi.fn();
    render(
      <ClashMatrixSidebar
        absoluteThreshold="5"
        onAbsoluteChange={mockChange}
      />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "10" },
    });
    expect(mockChange).toHaveBeenCalledWith("10");
  });

  it('renders the "Apply Thresholds" button', () => {
    render(<ClashMatrixSidebar />);
    expect(
      screen.getByRole("button", { name: /Apply Thresholds/i }),
    ).toBeInTheDocument();
  });

  it("calls onApply when the button is clicked", () => {
    const mockApply = vi.fn();
    render(<ClashMatrixSidebar onApply={mockApply} />);
    fireEvent.click(screen.getByRole("button", { name: /Apply Thresholds/i }));
    expect(mockApply).toHaveBeenCalledTimes(1);
  });
});
