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

export type ClashDetail = {
  clash: "sameday" | "adjacent";
  exams: Exam[];
};

export type ExamDisplayerProps = {
  exams: Exam[];
  rescheduleExams: Exam[];
  columns: Column[];
  venues: Venue[];
  selectedDay: Date;
  alertOpen: boolean;
  isLoading: boolean;
  pendingMove: PendingMove | null;
  handleConfirmMove: () => void;
  handleCancelMove: () => void;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  disablePreviousDay?: boolean;
  disableNextDay?: boolean;
  activeExam: Exam | null;
  examSplits: Exam[];
  splitDialogOpen: boolean;
  mergeDialogOpen: boolean;
  onSplitExam: (exam: Exam) => void;
  onMergeExam: (exam: Exam) => void;
  onSplitConfirm: (splits: { number_of_students: number }[]) => Promise<void>;
  onMergeConfirm: (
    examIds: number[],
    moveToReschedule?: boolean,
  ) => Promise<void>;
  onCloseSplit: () => void;
  onCloseMerge: () => void;
  clashColorMap?: Map<number, "orange" | "hotpink">;
  clashExamsMap?: Map<number, ClashDetail>;
  movingZoneIds?: string[];
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
