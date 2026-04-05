import { Exam } from "../components/types/calendarTypes";

export function getCapacityStatus(exams: Exam[], venueCapacity: number) {
  const occupied = exams.reduce((sum, e) => sum + e.number_of_students, 0);
  const pct = venueCapacity > 0 ? occupied / venueCapacity : 0;
  const colorClass =
    pct >= 1
      ? "text-red-600"
      : pct >= 0.8
        ? "text-orange-500"
        : "text-green-600";
  return { occupied, colorClass };
}
