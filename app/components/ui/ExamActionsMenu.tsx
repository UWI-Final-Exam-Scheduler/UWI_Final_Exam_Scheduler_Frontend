"use client";

import { ContextMenu } from "radix-ui";
import { Exam } from "../types/calendarTypes";

type ActionMenuProps = {
  exam: Exam;
  hasSplits: boolean;
  onSplitExam: (exam: Exam) => void;
  onMergeExam: (exam: Exam) => void;
  children: React.ReactNode;
};

export default function ExamContextMenu({
  exam,
  hasSplits,
  onSplitExam,
  onMergeExam,
  children,
}: ActionMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[150px] z-50">
          <ContextMenu.Item
            onSelect={() => onSplitExam(exam)}
            className="text-sm px-3 py-2 rounded cursor-pointer hover:bg-blue-50 hover:text-blue-700 outline-none select-none"
          >
            Split Exam
          </ContextMenu.Item>
          {hasSplits && (
            <ContextMenu.Item
              onSelect={() => onMergeExam(exam)}
              className="text-sm px-3 py-2 rounded cursor-pointer hover:bg-green-50 hover:text-green-700 outline-none select-none"
            >
              Merge Splits
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
