"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import CustomCard from "@/app/components/ui/CustomCard";
import { Spinner } from "@radix-ui/themes";
import { useCourses } from "@/app/hooks/useCourses";
import { PaginationControls } from "@/app/components/ui/PaginationControls";
import { Course } from "@/app/components/types/courseTypes";
import SubjectSelect from "@/app/components/ui/SubjectSelect";
import ClashMatrixSidebar from "@/app/components/ui/ClashMatrixSidebar";
import { useClashMatrix } from "@/app/hooks/useClashMatrix";
import { useThresholds } from "@/app/hooks/useThresholds";

export default function Courses() {
  const router = useRouter();
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

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const {
    inputPercentageThreshold,
    setInputPercentageThreshold,
    inputAbsoluteThreshold,
    setInputAbsoluteThreshold,
    percentageThreshold,
    absoluteThreshold,
    handleApplyThresholds,
    alertMsg,
  } = useThresholds();

  const absForBackend = Number(absoluteThreshold) || 0;
  const { loadingClashes, uniqueClashCount } = useClashMatrix(
    absForBackend,
    percentageThreshold,
  );

  const handleCourseClick = (course: Course) => {
    const params = new URLSearchParams();
    if (selectedSubject) params.set("subject", selectedSubject);
    params.set("page", String(page));
    router.push(
      `/course-clashes?courseCode=${course.courseCode}&enrolledStudents=${course.enrolledStudents}&${params.toString()}` as Route,
    );
  };

  return (
    <div className="flex gap-x-4">
      {showSidebar && (
        <ClashMatrixSidebar
          percentageThreshold={inputPercentageThreshold}
          absoluteThreshold={inputAbsoluteThreshold}
          onPercentageChange={setInputPercentageThreshold}
          onAbsoluteChange={setInputAbsoluteThreshold}
          onApply={handleApplyThresholds}
          clashCount={loadingClashes ? undefined : uniqueClashCount}
          totalCourses={courseResponse?.total || 0}
        />
      )}
      <main className={showSidebar ? "flex-1" : "w-full"}>
        <h1 className="text-2xl font-bold mb-2">Courses Page</h1>
        <div className="w-full mb-4">
          <SubjectSelect
            data={subjectCodes}
            onChange={(val) => {
              setSelectedSubject(val);
              handleFilterChange(val);
            }}
          />
        </div>

        {alertMsg && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
            {alertMsg}
          </div>
        )}

        {(isLoading || loadingClashes) && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
            <Spinner className="mr-2" />
            <span className="text-blue-700">Loading courses...</span>
          </div>
        )}

        {!isLoading && !loadingClashes && displayedCourses.length !== 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {displayedCourses.map((course: Course) => (
              <div
                key={course.courseCode}
                onClick={() => handleCourseClick(course)}
                className="cursor-pointer transition rounded-lg"
                title="Course details"
              >
                <CustomCard>
                  <h2 className="text-lg font-semibold">{course.courseCode}</h2>
                  <p className="text-sm text-gray-600">{course.name}</p>
                  <p className="text-sm text-gray-600">
                    Enrolled Students: {course.enrolledStudents}
                  </p>
                </CustomCard>
              </div>
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
      </main>
    </div>
  );
}
