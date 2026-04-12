export interface Course {
  courseCode: string;
  name: string;
  enrolledStudents: number;
}

export const mockCourse = (overrides?: Partial<Course>): Course => ({
  courseCode: "COMP1601",
  name: "Introduction to Computer Science",
  enrolledStudents: 120,
  ...overrides,
});

export const mockCourses = (): Course[] => [
  mockCourse(),
  mockCourse({
    courseCode: "MATH1141",
    name: "Calculus I",
    enrolledStudents: 150,
  }),
  mockCourse({
    courseCode: "MATH1115",
    name: "Linear Algebra",
    enrolledStudents: 130,
  }),
  mockCourse({
    courseCode: "PHYS2156",
    name: "Physics II",
    enrolledStudents: 85,
  }),
];
