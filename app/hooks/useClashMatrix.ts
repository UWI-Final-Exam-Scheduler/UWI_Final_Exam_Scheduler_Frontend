import { useQuery } from "@tanstack/react-query";
import { getClashMatrix } from "@/app/lib/clashMatrixFetch";

type ClashMatrixRow = {
  course: string;
  clashes: Array<{
    other_course: string;
    clash_count: number;
  }>;
};

type ClashMatrixResult = {
  clashes: ClashMatrixRow[];
  unique_courses_with_conflicts: number;
};

// plan to use to compare course codes consistently
const normalizeCourseCode = (code: string) => code.trim().toUpperCase();

export function useClashMatrix(
  absoluteThreshold: number,
  percentageThreshold: number,
) {
  const absForBackend = Number(absoluteThreshold) || 0;
  const percForBackend = Number(percentageThreshold) / 100;

  const { data, isLoading, refetch } = useQuery<ClashMatrixResult>({
    queryKey: ["clashMatrix", absForBackend, percForBackend],
    queryFn: () => getClashMatrix(absForBackend, percForBackend),
  });

  // plan to use for highlighting individual courses with at least one clash in the courses list page
  const coursesWithClashes = new Set(
    (data?.clashes ?? []).flatMap((row) =>
      row.clashes.length > 0
        ? [
            normalizeCourseCode(row.course),
            ...row.clashes.map((clash) =>
              normalizeCourseCode(clash.other_course),
            ),
          ]
        : [],
    ),
  );

  return {
    loadingClashes: isLoading,
    uniqueClashCount: isLoading
      ? undefined
      : data?.unique_courses_with_conflicts,
    coursesWithClashes,
    refetch,
  };
}
