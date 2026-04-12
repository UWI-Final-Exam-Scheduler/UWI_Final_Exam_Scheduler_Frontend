import {
  Exam,
  ClashExam,
  ClashDetail,
} from "@/app/components/types/calendarTypes";

export const mockExam = (overrides?: Partial<Exam>): Exam => ({
  id: 1,
  courseCode: "COMP1601",
  exam_date: "2025-05-12",
  date: "2025-05-12",
  time: 9,
  timeColumnId: "9",
  venue_id: 1,
  exam_length: 120,
  number_of_students: 45,
  ...overrides,
});

export const mockExamWithClash = (overrides?: Partial<Exam>): Exam => ({
  ...mockExam(overrides),
  id: 2,
  courseCode: "MATH1115",
  number_of_students: 30,
});

export const mockExamSplit1 = (): Exam => ({
  ...mockExam(),
  id: 3,
  number_of_students: 23,
});

export const mockExamSplit2 = (): Exam => ({
  ...mockExam(),
  id: 4,
  number_of_students: 22,
  venue_id: 2,
});

export const mockClashExam = (studentsAffected: number = 12): ClashExam => ({
  exam: mockExamWithClash(),
  studentsAffected,
});

export const mockClashDetail = (
  clash: "same-day-time" | "sameday" | "adjacent" = "same-day-time",
): ClashDetail => ({
  clash,
  clashExams: [mockClashExam(12), mockClashExam(8)],
});

export const mockExams = (): Exam[] => [
  mockExam(),
  mockExamWithClash(),
  {
    ...mockExam(),
    id: 5,
    courseCode: "PHYS2156",
    time: 13,
    timeColumnId: "1",
    number_of_students: 60,
  },
];

export const mockAdjacentDayExams = (): Exam[] => [
  {
    ...mockExam(),
    id: 10,
    exam_date: "2025-05-13",
    date: "2025-05-13",
    courseCode: "CHEM1401",
  },
];
