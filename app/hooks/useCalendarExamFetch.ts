import { useState, useRef, useEffect } from "react";
import { useExamStore } from "../state_management/examStore";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [haveExamsDay, setHaveExamsDay] = useState<Date[]>([]);
  const selectedDateRef = useRef<Date | undefined>(undefined);

  const {
    exams,
    setExams,
    rescheduleExams,
    setRescheduleExams,
    allScheduledExams,
    setAllScheduledExams,
  } = useExamStore();

  // prevent a failed fetch of one day from causing the entire schedule to fail loading
  const fetchScheduledExamsSafely = async (days: string[]) => {
    const settled = await Promise.allSettled(
      days.map((day) => examFetchbyDate(day)),
    );
    const allScheduled: Exam[] = [];

    settled.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allScheduled.push(
          ...result.value.map((exam: Exam) => ({
            ...exam,
            timeColumnId: String(exam.time),
          })),
        );
      } else {
        console.warn(
          `Skipping day ${days[index]} during schedule refresh:`,
          result.reason,
        );
      }
    });

    return allScheduled;
  };

  const refreshAllScheduledExams = async (days: string[]) => {
    const allScheduled = await fetchScheduledExamsSafely(days);
    setAllScheduledExams(allScheduled);
  };

  useEffect(() => {
    venueFetch()
      .then((data: Venue[]) => setVenues(data))
      .catch((err: unknown) => console.error("Failed to fetch venues:", err));
  }, []);

  useEffect(() => {
    const initializeExams = async () => {
      setIsInitialLoading(true);
      try {
        const days: string[] = await get_days_with_exams();
        setHaveExamsDay(days.map((d) => new Date(d + "T12:00:00")));

        const rescheduleData = await fetchExamstobeRescheduled();

        console.log(
          "reschedule from DB:",
          rescheduleData.map((e: Exam) => ({
            id: e.id,
            courseCode: e.courseCode,
          })),
        );
        setRescheduleExams(rescheduleData);

        const allScheduled = await fetchScheduledExamsSafely(days);
        setAllScheduledExams(allScheduled);
      } catch (err) {
        console.error("Failed to fetch initial exams:", err);
        setRescheduleExams([]);
        setAllScheduledExams([]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeExams();
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
    fetchRescheduleExams: async () => {
      const data = await fetchExamstobeRescheduled();
      setRescheduleExams(data);
    },
    haveExamsDay,
    isLoading,
    isInitialLoading,
    fetchDaysWithExams: async () => {
      try {
        const days: string[] = await get_days_with_exams();
        setHaveExamsDay(days.map((d) => new Date(d + "T12:00:00")));
        await refreshAllScheduledExams(days);
      } catch (error) {
        console.error("Error fetching days with exams:", error);
      }
    },
    selectedDateRef,
    venues,
    allScheduledExams,
  };
}
