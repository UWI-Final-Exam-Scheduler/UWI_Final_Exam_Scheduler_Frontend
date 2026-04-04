"use client";

import { createContext, useContext } from "react";
import { Exam } from "../types/calendarTypes";

type ExamActionsContextType = {
  allExams: Exam[];
  onSplitExam: (exam: Exam) => void;
  onMergeExam: (exam: Exam) => void;
};

export const ExamActionsContext = createContext<ExamActionsContextType | null>(
  null,
);

export function useExamActions() {
  const ctx = useContext(ExamActionsContext);
  if (!ctx)
    throw new Error(
      "useExamActions must be inside ExamActionsContext.Provider",
    );
  return ctx;
}
