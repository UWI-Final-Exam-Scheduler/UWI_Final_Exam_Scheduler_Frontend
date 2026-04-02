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
  venues: Venue[];
  selectedDay: Date;
  alertOpen: boolean;
  isLoading: boolean;
  pendingMove: PendingMove | null;
  handleConfirmMove: () => void;
  handleCancelMove: () => void;
  clashColorMap?: Map<number, "orange" | "hotpink">;
};

export type PendingMove = {
  examId: string;
  exam: Exam;
  fromColumnId: string;
  toColumnId: string;
  from: string;
  to: string;
  toVenueId?: number;
};

export type CalendarMoveActions = {
  handleMoveToReschedule: (move: PendingMove) => Promise<void>;
  handleMoveFromReschedule: (move: PendingMove, date: Date) => Promise<void>;
  handleSameDayTimeChange: (move: PendingMove) => Promise<void>;
};

export type Venue = {
  id: number;
  name: string;
  capacity: number;
};
