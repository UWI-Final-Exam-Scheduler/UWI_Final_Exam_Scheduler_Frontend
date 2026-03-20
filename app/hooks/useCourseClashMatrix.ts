import { useQuery } from "@tanstack/react-query";
import {
  getClashMatrixForCourse,
  type Clash,
} from "@/app/lib/courseClashFetch";

export function useCourseClashMatrix(
  courseCode: string,
  absoluteThreshold: number,
  percentageThreshold: number,
) {
  const percForBackend = Number(percentageThreshold) / 100;

  const { data, isLoading, refetch } = useQuery<Clash[]>({
    queryKey: [
      "courseClashMatrix",
      courseCode,
      absoluteThreshold,
      percForBackend,
    ],
    queryFn: () =>
      getClashMatrixForCourse(courseCode, absoluteThreshold, percForBackend),
    enabled: !!courseCode,
  });

  return {
    clashes: data ?? [],
    loading: isLoading,
    refetch,
  };
}
