import { useQuery } from "@tanstack/react-query";
import { getClashMatrix } from "@/app/lib/clashMatrixFetch";
import { buildCourseClashesSet } from "@/app/lib/courseClashes";
import { useMemo } from "react";
import { normalizeCourseCode } from "@/app/lib/courseClashes";

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

  const clashPairsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const { course1, course2 } of data?.conflicting_courses ?? []) {
      const c1 = normalizeCourseCode(course1);
      const c2 = normalizeCourseCode(course2);
      if (!map.has(c1)) map.set(c1, new Set());
      if (!map.has(c2)) map.set(c2, new Set());
      map.get(c1)!.add(c2);
      map.get(c2)!.add(c1);
    }
    return map;
  }, [data]);

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
    clashPairsMap,
    refetch,
  };
}
