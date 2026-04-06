import { useState, useEffect } from "react";
import { Exam } from "@/app/components/types/calendarTypes";
import { examFetchbyDate, formatDatetoString } from "@/app/lib/examFetch";

function shiftDate(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + offset);
  return d;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function shiftToWeekday(date: Date, offset: -1 | 1): Date {
  let d = shiftDate(date, offset);
  while (isWeekend(d)) {
    d = shiftDate(d, offset);
  }
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
        examFetchbyDate(formatDatetoString(shiftToWeekday(selectedDate, -1))),
        examFetchbyDate(formatDatetoString(shiftToWeekday(selectedDate, 1))),
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
