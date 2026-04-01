import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Course } from "@/app/components/types/courseTypes";
import { Option } from "@/app/components/types/subjectSelectTypes";
import { ClashFilterValue } from "@/app/components/ui/CourseClashFilter";

type UseCoursesPageFiltersArgs = {
  displayedCourses: Course[];
  coursesWithClashes: Set<string>;
  page: number;
  setPage: (page: number) => void;
  handleFilterChange: (subjectCode: string | null) => void;
  initialSubject: string | null;
  initialCourseCode: string | null;
  initialClashFilter: ClashFilterValue;
};

const normalizeCourseCode = (code: string) => code.trim().toUpperCase();

const buildCoursesQueryParams = (
  selectedSubject: string | null,
  selectedCourseCode: string | null,
  page: number,
  clashFilter: ClashFilterValue,
): string => {
  const params = new URLSearchParams();

  if (selectedSubject) params.set("subject", selectedSubject);
  if (selectedCourseCode) params.set("courseCodeFilter", selectedCourseCode);
  if (page > 1) params.set("page", String(page));
  if (clashFilter !== "all") params.set("clashFilter", clashFilter);

  return params.toString();
};

export function useCoursesPageFilters({
  displayedCourses,
  coursesWithClashes,
  page,
  setPage,
  handleFilterChange,
  initialSubject,
  initialCourseCode,
  initialClashFilter,
}: UseCoursesPageFiltersArgs) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    initialSubject,
  );
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(
    initialCourseCode,
  );
  const [clashFilter, setClashFilter] =
    useState<ClashFilterValue>(initialClashFilter);

  const courseCodeOptions = useMemo<Option[]>(() => {
    const uniqueCodes = Array.from(
      new Set(
        displayedCourses.map((course) =>
          normalizeCourseCode(course.courseCode),
        ),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return uniqueCodes.map((code) => ({ value: code, label: code }));
  }, [displayedCourses]);

  const filteredCourses = useMemo(() => {
    return displayedCourses.filter((course) => {
      const normalizedCode = normalizeCourseCode(course.courseCode);

      if (
        selectedCourseCode &&
        normalizedCode !== normalizeCourseCode(selectedCourseCode)
      ) {
        return false;
      }

      const hasClash = coursesWithClashes.has(normalizedCode);

      if (clashFilter === "with") return hasClash;
      if (clashFilter === "without") return !hasClash;
      return true;
    });
  }, [displayedCourses, clashFilter, coursesWithClashes, selectedCourseCode]);

  const onSubjectChange = (val: string | null) => {
    setSelectedSubject(val);
    setSelectedCourseCode(null);
    handleFilterChange(val);
  };

  const onCourseCodeChange = (val: string | null) => {
    setSelectedCourseCode(val);
    setPage(1);
  };

  const onClashFilterChange = (val: ClashFilterValue) => {
    setClashFilter(val);
  };

  const handleCourseClick = (course: Course) => {
    const queryParams = buildCoursesQueryParams(
      selectedSubject,
      selectedCourseCode,
      page,
      clashFilter,
    );

    router.push(
      `/course-clashes?courseCode=${course.courseCode}&enrolledStudents=${course.enrolledStudents}&${queryParams}` as Route,
    );
  };

  useEffect(() => {
    const nextQuery = buildCoursesQueryParams(
      selectedSubject,
      selectedCourseCode,
      page,
      clashFilter,
    );
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) return;

    const nextUrl = nextQuery ? `/courses?${nextQuery}` : "/courses";
    router.replace(nextUrl as Route);
  }, [
    router,
    searchParams,
    selectedSubject,
    selectedCourseCode,
    page,
    clashFilter,
  ]);

  return {
    selectedSubject,
    selectedCourseCode,
    clashFilter,
    courseCodeOptions,
    filteredCourses,
    onSubjectChange,
    onCourseCodeChange,
    onClashFilterChange,
    handleCourseClick,
  };
}
