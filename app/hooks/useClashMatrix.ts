import { useQuery } from "@tanstack/react-query";
import { getClashMatrix } from "@/app/lib/clashMatrixFetch";

type ClashMatrixResult = {
  conflicting_courses: Array<{
    course1: string;
    course2: string;
    clash_count: number;
  }>;
  courses: Array<{
    course: string;
    has_clash: boolean;
  }>;
  total_conflicts: number;
  unique_courses_with_conflicts: number;
  total_students_affected: number;
  percentage_students_affected: number;
};

const normalizeCourseCode = (code: string) => code.trim().toUpperCase();

export function useClashMatrix(
  absoluteThreshold: number,
  percentageThreshold: number,
) {
  const absForBackend = Number(absoluteThreshold) || 0;
  const percForBackend = Number(percentageThreshold) / 100;

  const { data, isLoading, isError, error, refetch } =
    useQuery<ClashMatrixResult>({
      queryKey: ["clashMatrix", absForBackend, percForBackend],
      queryFn: () => getClashMatrix(absForBackend, percForBackend),
      retry: false,
    });

  // plan to use for highlighting individual courses with at least one clash in the courses list page
  const coursesWithClashes = new Set(
    (data?.courses ?? [])
      .filter((c) => c.has_clash)
      .map((c) => normalizeCourseCode(c.course)),
  );

  return {
    loadingClashes: isLoading,
    clashError: isError
      ? error instanceof Error
        ? error.message
        : "Failed to fetch clash matrix. Refresh to try again."
      : "",
    uniqueClashCount:
      isLoading || isError
        ? undefined
        : (data?.unique_courses_with_conflicts ?? 0),
    totalStudentsAffected:
      isLoading || isError ? undefined : (data?.total_students_affected ?? 0),
    percentageStudentsAffected:
      isLoading || isError
        ? undefined
        : (data?.percentage_students_affected ?? 0),
    coursesWithClashes,
    refetch,
  };
}
