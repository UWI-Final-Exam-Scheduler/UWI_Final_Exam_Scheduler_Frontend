import { useState, useEffect, useCallback } from "react";
import {
  courseFetch,
  fetchSubjectCodes,
  fetchCoursesBySubject,
} from "@/app/lib/courseFetch";
import { Course, CoursesResponse } from "@/app/components/types/courseTypes";

export function useCourses() {
  const [paginationResponse, setPaginationResponse] =
    useState<CoursesResponse | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [subjectCodes, setSubjectCodes] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const loadCourses = useCallback(
    async (subjectCode: string | null, pageNum: number) => {
      setIsLoading(true);
      // setDisplayedCourses([]);
      try {
        if (!subjectCode) {
          const data = await courseFetch(pageNum);
          setPaginationResponse(data);
          setCourses(data.courses);
          setDisplayedCourses(data.courses);
          setError("");
        } else {
          const details = await fetchCoursesBySubject(subjectCode, pageNum);
          setPaginationResponse(details);
          setCourses(details.courses);
          setDisplayedCourses(details.courses);
          setError("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching courses");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadCourses(selectedSubject, page);
  }, [page, selectedSubject]);

  const handleFilterChange = useCallback(async (subjectCode: string | null) => {
    setSelectedSubject(subjectCode);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchSubjectCodes()
      .then(setSubjectCodes)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error fetching subject codes",
        ),
      );
  }, []);

  return {
    paginationResponse,
    displayedCourses,
    subjectCodes,
    courses,
    isLoading,
    error,
    page,
    setPage,
    handleFilterChange,
  };
}
