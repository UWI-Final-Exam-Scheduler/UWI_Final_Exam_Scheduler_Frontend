"use client";

import CustomCard from "@/app/components/ui/CustomCard";
import CourseSelect from "@/app/components/ui/CourseSelect";
import { Spinner } from "@radix-ui/themes";
import { useCourses } from "@/app/hooks/useCourses";
import { PaginationControls } from "@/app/components/ui/PaginationControls";
import { Course } from "@/app/components/types/courseTypes";

export default function Courses() {
  const {
    courseResponse,
    displayedCourses,
    courses,
    isLoading,
    error,
    page,
    setPage,
    handleFilterChange,
  } = useCourses();

  if (isLoading && !courseResponse) {
    // when first loading the page
    return (
      <div>
        <h1>Loading...</h1>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1>Courses Page</h1>
      <div className="mb-4">
        <CourseSelect key={page} data={courses} onChange={handleFilterChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedCourses.map((course: Course) => (
          <CustomCard key={course.courseCode}>
            <h2 className="text-lg font-semibold">{course.courseCode}</h2>
            <p className="text-sm text-gray-600">{course.name}</p>
            <p className="text-sm text-gray-600">
              Enrolled Students: {course.enrolledStudents}
            </p>
          </CustomCard>
        ))}
        {isLoading &&
          displayedCourses.length === 0 && ( // when changing the page
            <div>
              <h1>Loading...</h1>
              <Spinner />
            </div>
          )}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
      <PaginationControls
        page={page}
        totalPages={courseResponse?.pages || 1}
        hasNext={courseResponse?.has_next || false}
        onPageChange={setPage}
      />
    </div>
  );
}
