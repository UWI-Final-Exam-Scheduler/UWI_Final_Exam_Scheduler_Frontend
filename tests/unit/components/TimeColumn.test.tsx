import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TimeColumn from "@/app/components/ui/TimeColumn";
import { mockExams } from "../mocks/examMockData";
import { mockVenues } from "../mocks/venueMockData";

const mockColumn = { id: "9", title: "9:00 AM" };

describe("TimeColumn", () => {
  it("should display the time column title", () => {
    render(<TimeColumn column={mockColumn} exams={[]} venues={[]} />);
    expect(screen.getByText("9:00 AM")).toBeInTheDocument();
  });

  it("should display number of exams in column", () => {
    render(<TimeColumn column={mockColumn} exams={mockExams()} venues={[]} />);
    expect(screen.getByText(/3 exams/i)).toBeInTheDocument();
  });

  it("should show capacity for each venue", () => {
    const exams = [mockExams()[0]]; // 45 students, venue_id: 1
    const venues = mockVenues().slice(0, 1); // capacity 100

    render(<TimeColumn column={mockColumn} exams={exams} venues={venues} />);
    expect(screen.getByText(/45\/100 students/i)).toBeInTheDocument();
  });

  it("should show drop placeholder when no exams", () => {
    render(<TimeColumn column={mockColumn} exams={[]} venues={mockVenues()} />);
    expect(screen.getAllByText("Drop here").length).toBeGreaterThan(0);
  });

  it("should render all exam course codes", () => {
    render(<TimeColumn column={mockColumn} exams={mockExams()} venues={[]} />);
    expect(screen.getByText("COMP1601")).toBeInTheDocument();
    expect(screen.getByText("MATH1115")).toBeInTheDocument();
  });

  it("should group exams into separate venue sections", () => {
    const exams = [mockExams()[0], { ...mockExams()[1], venue_id: 2 }];
    const venues = mockVenues().slice(0, 2);

    render(<TimeColumn column={mockColumn} exams={exams} venues={venues} />);
    expect(screen.getByText("MD2")).toBeInTheDocument();
    expect(screen.getByText("MD3")).toBeInTheDocument();
  });

  it("should show exam count as singular when only 1 exam", () => {
    render(
      <TimeColumn column={mockColumn} exams={[mockExams()[0]]} venues={[]} />,
    );
    expect(screen.getByText(/1 exam$/i)).toBeInTheDocument();
  });
});
