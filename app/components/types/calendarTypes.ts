export type Column = {
  id: string;
  title: string;
};

export type Exam = {
  id: string;
  courseCode: string;
  timeColumnId: string;
};

export type ExamDisplayerProps = {
  selectedDay: Date;
  exams: Exam[];
  columns: Column[];
  alertOpen: boolean;
  pendingMove: PendingMove | null;
  handleConfirmMove: () => void;
  handleCancelMove: () => void;
};

export type PendingMove = {
  examId: string;
  exam: Exam;
  fromColumnId: string;
  toColumnId: string;
  from: string;
  to: string;
};
