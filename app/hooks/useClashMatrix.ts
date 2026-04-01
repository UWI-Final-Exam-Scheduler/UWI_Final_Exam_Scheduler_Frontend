import { useQuery } from "@tanstack/react-query";
import { getClashMatrix } from "@/app/lib/clashMatrixFetch";
import { buildCourseClashesSet } from "@/app/lib/courseClashes";

type ClashMatrixResult = {
  conflicting_courses: Array<{
    course1: string;
    course2: string;
    clash_count: number;
  }>;
  courses_with_clashes: string[];
  total_conflicts: number;
  unique_courses_with_conflicts: number;
  total_students_affected: number;
  percentage_students_affected: number;
};

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

  const coursesWithClashes = buildCourseClashesSet(
    data?.courses_with_clashes ?? [],
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
