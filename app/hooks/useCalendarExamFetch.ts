import { useState, useRef, useEffect } from "react";
import { Exam, Venue } from "../components/types/calendarTypes";
import {
  get_days_with_exams,
  fetchExamstobeRescheduled,
  formatDatetoString,
  examFetchbyDate,
} from "../lib/examFetch";
import { venueFetch } from "../lib/venueFetch";

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function useCalendarExamFetch(date: Date | undefined) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [rescheduleExams, setRescheduleExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [haveExamsDay, setHaveExamsDay] = useState<Date[]>([]);
  const selectedDateRef = useRef<Date | undefined>(undefined);

  const fetchDaysWithExams = async () => {
    try {
      const days: string[] = await get_days_with_exams();
      setHaveExamsDay(days.map((d) => new Date(d + "T12:00:00")));
    } catch (error) {
      console.error("Error fetching days with exams:", error);
    }
  };

  useEffect(() => {
    fetchDaysWithExams();
  }, []);

  useEffect(() => {
    venueFetch()
      .then((data: Venue[]) => setVenues(data))
      .catch((err: unknown) => console.error("Failed to fetch venues:", err));
  }, []);

  const fetchRescheduleExams = async () => {
    try {
      const data = await fetchExamstobeRescheduled();
      console.log(
        "reschedule from DB:",
        data.map((e: Exam) => ({ id: e.id, courseCode: e.courseCode })),
      );
      setRescheduleExams(data);
    } catch (err) {
      console.error("Failed to fetch reschedule exams:", err);
      setRescheduleExams([]);
    }
  };

  useEffect(() => {
    fetchRescheduleExams();
  }, []);

  useEffect(() => {
    selectedDateRef.current = date;
    if (!date) return;
    if (isWeekend(date)) {
      setExams([]);
      return;
    }
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const data = await examFetchbyDate(formatDatetoString(date));
        setExams(
          data.map((exam: Exam) => ({
            ...exam,
            timeColumnId: String(exam.time),
          })),
        );
      } catch (err) {
        console.error("Failed to fetch exams:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, [date]);

  return {
    exams,
    setExams,
    rescheduleExams,
    setRescheduleExams,
    fetchRescheduleExams,
    haveExamsDay,
    isLoading,
    fetchDaysWithExams,
    selectedDateRef,
    venues,
  };
}
