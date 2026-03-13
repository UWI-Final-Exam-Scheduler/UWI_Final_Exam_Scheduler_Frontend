export type Course = {
  courseCode: string;
  name: string;
  enrolledStudents: number;
};

export type CoursesResponse = {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  courses: Course[];
};
