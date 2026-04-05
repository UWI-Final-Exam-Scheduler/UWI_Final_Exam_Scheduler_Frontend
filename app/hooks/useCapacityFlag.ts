import { useMemo } from "react";
import { Exam, Venue } from "../components/types/calendarTypes";

export function useCapacityFlag(exams: Exam[], venues: Venue[]) {
  // this recomputes only when exams or venues change
  const occupancyMap = useMemo(() => {
    const map: Record<number, Record<string, number>> = {};

    for (const exam of exams) {
      if (!map[exam.venue_id]) map[exam.venue_id] = {};
      const col = exam.timeColumnId;
      map[exam.venue_id][col] =
        (map[exam.venue_id][col] ?? 0) + exam.number_of_students;
    }
    return map;
  }, [exams]);

  function wouldExceedCapacity(
    toVenueId: number,
    toTimeColumnId: string,
    incomingStudents: number,
  ): boolean {
    const venue = venues.find((v) => v.id === toVenueId);
    if (!venue) return false; // unknown venue — let it through

    const occupied = occupancyMap[toVenueId]?.[toTimeColumnId] ?? 0;
    return occupied + incomingStudents > venue.capacity;
  }

  return { occupancyMap, wouldExceedCapacity };
}
