import { useState, useEffect, useCallback } from "react";
import { courseFetch, fetchCourseByCode } from "@/app/lib/courseFetch";
import { Course, CoursesResponse } from "@/app/components/types/courseTypes";

export function useCourses() {
  const [courseResponse, setCourseResponse] = useState<CoursesResponse | null>(
    null,
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadCourses = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setDisplayedCourses([]);
    try {
      const data = await courseFetch(pageNum);
      setCourseResponse(data);
      setCourses(data.courses);
      setDisplayedCourses(data.courses);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching courses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFilterChange = useCallback(
    async (courseCode: string | null) => {
      setIsLoading(true);
      try {
        if (!courseCode) {
          setDisplayedCourses(courses);
          return;
        }
        const details = await fetchCourseByCode(courseCode);
        setDisplayedCourses([details]);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching course details",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [courses],
  );

  useEffect(() => {
    loadCourses(page);
  }, [page, loadCourses]);

  return {
    courseResponse,
    displayedCourses,
    courses,
    isLoading,
    error,
    page,
    setPage,
    handleFilterChange,
  };
}
