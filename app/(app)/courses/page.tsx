"use client";

import CustomCard from "@/app/components/ui/CustomCard";
import { Spinner } from "@radix-ui/themes";
import { useCourses } from "@/app/hooks/useCourses";
import { PaginationControls } from "@/app/components/ui/PaginationControls";
import { Course } from "@/app/components/types/courseTypes";
import SubjectSelect from "@/app/components/ui/SubjectSelect";

export default function Courses() {
  const {
    paginationResponse: courseResponse,
    displayedCourses,
    subjectCodes,
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
        <SubjectSelect data={subjectCodes} onChange={handleFilterChange} />
      </div>

      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
          <Spinner className="mr-2" />
          <span className="text-blue-700">Loading courses...</span>
        </div>
      )}

      {!isLoading && displayedCourses.length !== 0 && (
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
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}
      <PaginationControls
        page={page}
        totalPages={courseResponse?.pages || 1}
        hasNext={courseResponse?.has_next || false}
        onPageChange={setPage}
      />
    </div>
  );
}
