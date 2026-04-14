import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExamContextMenu from "@/app/components/ui/ExamActionsMenu";
import { mockExam } from "../mocks/examMockData";

const defaultProps = {
  exam: mockExam(),
  hasSplits: false,
  onSplitExam: vi.fn(),
  onMergeExam: vi.fn(),
};

describe("ExamActionsMenu (Context Menu)", () => {
  it("should render children inside the context menu trigger", () => {
    render(
      <ExamContextMenu {...defaultProps}>
        <div>Exam Card</div>
      </ExamContextMenu>,
    );

    expect(screen.getByText("Exam Card")).toBeInTheDocument();
  });

  it('should show "Split Exam" option on right-click', () => {
    render(
      <ExamContextMenu {...defaultProps}>
        <div>Exam Card</div>
      </ExamContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText("Exam Card"));

    expect(screen.getByText("Split Exam")).toBeInTheDocument();
  });

  it('should NOT show "Merge Splits" when hasSplits is false', () => {
    render(
      <ExamContextMenu {...defaultProps} hasSplits={false}>
        <div>Exam Card</div>
      </ExamContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText("Exam Card"));

    expect(screen.queryByText("Merge Splits")).not.toBeInTheDocument();
  });

  it('should show "Merge Splits" when hasSplits is true', () => {
    render(
      <ExamContextMenu {...defaultProps} hasSplits={true}>
        <div>Exam Card</div>
      </ExamContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText("Exam Card"));

    expect(screen.getByText("Merge Splits")).toBeInTheDocument();
  });

  it('should call onSplitExam with the exam when "Split Exam" is clicked', async () => {
    const user = userEvent.setup();
    const onSplitExam = vi.fn();
    const exam = mockExam();

    render(
      <ExamContextMenu {...defaultProps} exam={exam} onSplitExam={onSplitExam}>
        <div>Exam Card</div>
      </ExamContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText("Exam Card"));
    await user.click(screen.getByText("Split Exam"));

    expect(onSplitExam).toHaveBeenCalledWith(exam);
  });

  it('should call onMergeExam with the exam when "Merge Splits" is clicked', async () => {
    const user = userEvent.setup();
    const onMergeExam = vi.fn();
    const exam = mockExam();

    render(
      <ExamContextMenu
        {...defaultProps}
        exam={exam}
        hasSplits={true}
        onMergeExam={onMergeExam}
      >
        <div>Exam Card</div>
      </ExamContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText("Exam Card"));
    await user.click(screen.getByText("Merge Splits"));

    expect(onMergeExam).toHaveBeenCalledWith(exam);
  });
});
