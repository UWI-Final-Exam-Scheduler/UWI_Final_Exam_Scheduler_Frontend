import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ExamCardDnD from "@/app/components/ui/ExamCardDnD";
import {
  mockExam,
  mockExamSplit1,
  mockExamSplit2,
  mockClashDetail,
} from "../mocks/examMockData";

describe("ExamCardDnD", () => {
  it("should display exam course code and student count", () => {
    const exam = mockExam();
    render(<ExamCardDnD exam={exam} allExams={[exam]} />);

    expect(screen.getByText("COMP1601")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("should apply red background for same day & time clashes", () => {
    const exam = mockExam();
    const { container } = render(<ExamCardDnD exam={exam} clashColor="red" />);

    const card = container.querySelector('[style*="background-color"]');
    expect(card).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
  });

  it("should apply hotpink background for same-day clashes", () => {
    const exam = mockExam();
    const { container } = render(
      <ExamCardDnD exam={exam} clashColor="hotpink" />,
    );

    const card = container.querySelector('[style*="background-color"]');
    expect(card).toHaveStyle({ backgroundColor: "rgb(255, 105, 180)" });
  });

  it("should apply orange background for adjacent-day clashes", () => {
    const exam = mockExam();
    const { container } = render(
      <ExamCardDnD exam={exam} clashColor="orange" />,
    );

    const card = container.querySelector('[style*="background-color"]');
    expect(card).toHaveStyle({ backgroundColor: "rgb(255, 165, 0)" });
  });

  it("should display split indicators when course has multiple sections", () => {
    const exam1 = mockExamSplit1();
    const exam2 = mockExamSplit2();
    const allExams = [exam1, exam2];

    const { rerender } = render(
      <ExamCardDnD exam={exam1} allExams={allExams} />,
    );
    expect(screen.getByText(/Split:1\/2/i)).toBeInTheDocument();

    rerender(<ExamCardDnD exam={exam2} allExams={allExams} />);
    expect(screen.getByText(/Split:2\/2/i)).toBeInTheDocument();
  });

  it("should not show split label for a single exam", () => {
    const exam = mockExam();
    render(<ExamCardDnD exam={exam} allExams={[exam]} />);

    expect(screen.queryByText(/Split:/i)).not.toBeInTheDocument();
  });

  it("should render without crash when clash detail is provided", () => {
    const exam = mockExam();
    expect(() =>
      render(
        <ExamCardDnD
          exam={exam}
          allExams={[exam]}
          clashDetail={mockClashDetail("same-day-time")}
        />,
      ),
    ).not.toThrow();
  });
});
