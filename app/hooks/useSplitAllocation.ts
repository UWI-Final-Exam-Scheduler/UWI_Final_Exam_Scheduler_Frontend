type SplitEntry = { number_of_students: number };

export function useSplitAllocation(splits: SplitEntry[], total: number) {
  const allocated = splits.reduce((sum, s) => sum + s.number_of_students, 0);
  const remaining = total - allocated;
  const isValid =
    allocated === total && splits.every((s) => s.number_of_students > 0);
  return { allocated, remaining, isValid };
}
