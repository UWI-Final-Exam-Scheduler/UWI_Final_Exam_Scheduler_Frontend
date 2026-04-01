"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import CustomCard from "@/app/components/ui/CustomCard";
import { Spinner } from "@radix-ui/themes";
import { useCourses } from "@/app/hooks/useCourses";
import { PaginationControls } from "@/app/components/ui/PaginationControls";
import { Course } from "@/app/components/types/courseTypes";
import SubjectSelect from "@/app/components/ui/SubjectSelect";
import CourseClashFilter, {
  ClashFilterValue,
} from "@/app/components/ui/CourseClashFilter";
import ClashMatrixSidebar from "@/app/components/ui/ClashMatrixSidebar";
import { useClashMatrix } from "@/app/hooks/useClashMatrix";
import { useCoursesPageFilters } from "@/app/hooks/useCoursesPageFilters";
import { useCoursesThresholdPreferences } from "@/app/hooks/useCoursesThresholdPreferences";

const normalizeCourseCode = (code: string) => code.trim().toUpperCase();

export default function Courses() {
  const searchParams = useSearchParams();

  const subjectFromUrl = searchParams.get("subject");
  const pageFromUrl = Number(searchParams.get("page") || "1");
  const initialPage =
    Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  const clashFilterFromUrl = searchParams.get("clashFilter");
  const initialClashFilter: ClashFilterValue =
    clashFilterFromUrl === "with" ||
    clashFilterFromUrl === "without" ||
    clashFilterFromUrl === "all"
      ? clashFilterFromUrl
      : "all";
  const courseCodeFilterFromUrl = searchParams.get("courseCodeFilter");

  const {
    paginationResponse: courseResponse,
    displayedCourses,
    subjectCodes,
    isLoading,
    error,
    page,
    setPage,
    handleFilterChange,
  } = useCourses(subjectFromUrl, initialPage);

  const [showSidebar] = useState(true);

  const {
    inputPercentageThreshold,
    setInputPercentageThreshold,
    inputAbsoluteThreshold,
    setInputAbsoluteThreshold,
    percentageThreshold,
    absoluteThreshold,
    alertMsg,
    handleApplyAndSaveThresholds,
  } = useCoursesThresholdPreferences({
    onThresholdsApplied: () => setPage(1),
  });

  const absForBackend = Number(absoluteThreshold) || 0;
  const {
    loadingClashes,
    clashError,
    uniqueClashCount,
    totalStudentsAffected,
    percentageStudentsAffected,
    coursesWithClashes,
  } = useClashMatrix(absForBackend, percentageThreshold);

  const {
    selectedSubject,
    selectedCourseCode,
    clashFilter,
    courseCodeOptions,
    filteredCourses,
    onSubjectChange,
    onCourseCodeChange,
    onClashFilterChange,
    handleCourseClick,
  } = useCoursesPageFilters({
    displayedCourses,
    coursesWithClashes,
    page,
    setPage,
    handleFilterChange,
    initialSubject: subjectFromUrl,
    initialCourseCode: courseCodeFilterFromUrl,
    initialClashFilter,
  });

  return (
    <div className="flex gap-x-4">
      {showSidebar && (
        <ClashMatrixSidebar
          percentageThreshold={inputPercentageThreshold}
          absoluteThreshold={inputAbsoluteThreshold}
          onPercentageChange={setInputPercentageThreshold}
          onAbsoluteChange={setInputAbsoluteThreshold}
          onApply={handleApplyAndSaveThresholds}
          clashCount={
            loadingClashes || clashError ? undefined : uniqueClashCount
          }
          totalCourses={courseResponse?.total || 0}
          affectedStudentsCount={
            loadingClashes || clashError ? undefined : totalStudentsAffected
          }
          affectedStudentsPercentage={
            loadingClashes || clashError
              ? undefined
              : percentageStudentsAffected
          }
        />
      )}

      <main className={showSidebar ? "flex-1" : "w-full"}>
        <h1 className="text-2xl font-bold mb-2">Courses Page</h1>

        <div className="w-full mb-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="w-full md:max-w-105">
            <SubjectSelect
              data={subjectCodes}
              value={selectedSubject}
              instanceId="subject-filter-select"
              placeholder="Select a subject..."
              onChange={onSubjectChange}
            />
          </div>

          <div className="w-full md:max-w-65">
            <SubjectSelect
              data={courseCodeOptions}
              value={selectedCourseCode}
              instanceId="course-code-filter-select"
              placeholder="Select a course code..."
              onChange={onCourseCodeChange}
            />
          </div>

          <div className="w-full md:max-w-65">
            <CourseClashFilter
              value={clashFilter}
              onChange={onClashFilterChange}
            />
          </div>
        </div>

        {alertMsg && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
            {alertMsg}
          </div>
        )}

        {clashError && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
            {clashError}
          </div>
        )}

        {(isLoading || loadingClashes) && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
            <Spinner className="mr-2" />
            <span className="text-blue-700">Loading courses...</span>
          </div>
        )}

        {!isLoading && !loadingClashes && filteredCourses.length !== 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {filteredCourses.map((course: Course) => {
              const hasClash = coursesWithClashes.has(
                normalizeCourseCode(course.courseCode),
              );

              return (
                <div
                  key={course.courseCode}
                  onClick={() => handleCourseClick(course)}
                  className="cursor-pointer transition rounded-lg"
                  title="Course details"
                >
                  <CustomCard
                    className={
                      hasClash
                        ? "border! border-orange-300! bg-orange-100!"
                        : "border! border-gray-200! bg-white!"
                    }
                  >
                    <h2 className="text-lg font-semibold">
                      {course.courseCode}
                    </h2>
                    <p className="text-sm text-gray-600">{course.name}</p>
                    <p className="text-sm text-gray-600">
                      Enrolled Students: {course.enrolledStudents}
                    </p>
                  </CustomCard>
                </div>
              );
            })}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}

        {!isLoading && !loadingClashes && filteredCourses.length === 0 && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            No courses match the selected clash filter.
          </div>
        )}

        <PaginationControls
          page={page}
          totalPages={courseResponse?.pages || 1}
          hasNext={courseResponse?.has_next || false}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
}
