import { useState } from "react";
import { Exam } from "../components/types/calendarTypes";

export function useMergeSelection(splits: Exam[]) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(splits.map((s) => s.id)),
  );

  const selectedSplits = splits.filter((s) => selected.has(s.id));
  const totalStudents = selectedSplits.reduce(
    (sum, s) => sum + s.number_of_students,
    0,
  );

  function toggleSplit(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return { selected, selectedSplits, totalStudents, toggleSplit };
}
