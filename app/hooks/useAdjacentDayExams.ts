import { useState, useEffect } from "react";
import { Exam } from "@/app/components/types/calendarTypes";
import { examFetchbyDate, formatDatetoString } from "@/app/lib/examFetch";

function shiftDate(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + offset);
  return d;
}

export function useAdjacentDayExams(selectedDate: Date | undefined) {
  const [prevDayExams, setPrevDayExams] = useState<Exam[]>([]);
  const [nextDayExams, setNextDayExams] = useState<Exam[]>([]);

  useEffect(() => {
    if (!selectedDate) return; // state stays [] from init — no sync setState

    let cancelled = false;

    const fetchAdjacent = async () => {
      const [prev, next] = await Promise.allSettled([
        examFetchbyDate(formatDatetoString(shiftDate(selectedDate, -1))),
        examFetchbyDate(formatDatetoString(shiftDate(selectedDate, 1))),
      ]);
      if (!cancelled) {
        setPrevDayExams(prev.status === "fulfilled" ? prev.value : []);
        setNextDayExams(next.status === "fulfilled" ? next.value : []);
      }
    };

    fetchAdjacent();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return { prevDayExams, nextDayExams };
}
