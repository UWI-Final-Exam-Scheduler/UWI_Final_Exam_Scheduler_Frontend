import { useClashMatrix } from "@/app/hooks/useClashMatrix";

export function useCoursesWithClashes(
  absoluteThreshold: number,
  percentageThreshold: number,
) {
  const {
    coursesWithClashes,
    loadingClashes,
    clashError,
    refetch,
    uniqueClashCount,
    totalStudentsAffected,
    percentageStudentsAffected,
  } = useClashMatrix(absoluteThreshold, percentageThreshold);

  return {
    courseClashesSet: coursesWithClashes,
    loadingClashes,
    clashError,
    refetch,
    uniqueClashCount,
    totalStudentsAffected,
    percentageStudentsAffected,
  };
}
