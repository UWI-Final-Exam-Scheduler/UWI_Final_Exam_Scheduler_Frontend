export type Column = {
  id: string;
  title: string;
};

export type Exam = {
  id: number;
  courseCode: string;
  exam_date: string;
  date: string | null;
  time: number;
  timeColumnId: string;
  venue_id: number;
  exam_length: number;
  number_of_students: number;
};

export type ExamDisplayerProps = {
  exams: Exam[];
  columns: Column[];
  selectedDay: Date;
  alertOpen: boolean;
  isLoading: boolean;
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
