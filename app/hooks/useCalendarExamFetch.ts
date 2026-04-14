import { useState, useRef, useEffect, useCallback } from "react";
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
  const [isRescheduleLoading, setIsRescheduleLoading] = useState(true);
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

  const fetchExamsForDate = useCallback(
    async (targetDate: Date, showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await examFetchbyDate(formatDatetoString(targetDate));
        setExams(
          data.map((exam: Exam) => ({
            ...exam,
            timeColumnId: String(exam.time),
          })),
        );
      } catch (err) {
        console.error("Failed to fetch exams:", err);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [setExams],
  );

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

        setIsRescheduleLoading(true);
        const rescheduleData = await fetchExamstobeRescheduled();
        setRescheduleExams(rescheduleData);

        const allScheduled = await fetchScheduledExamsSafely(days);
        setAllScheduledExams(allScheduled);
      } catch (err) {
        console.error("Failed to fetch initial exams:", err);
        setRescheduleExams([]);
        setAllScheduledExams([]);
      } finally {
        setIsRescheduleLoading(false);
        setIsInitialLoading(false);
      }
    };

    initializeExams();
  }, [setAllScheduledExams, setRescheduleExams]);

  useEffect(() => {
    selectedDateRef.current = date;
    if (!date) return;
    if (isWeekend(date)) {
      setExams([]);
      return;
    }
    fetchExamsForDate(date);
  }, [date, fetchExamsForDate, setExams]);

  return {
    exams,
    setExams,
    rescheduleExams,
    setRescheduleExams,
    fetchRescheduleExams: async (showLoading = true) => {
      if (showLoading) setIsRescheduleLoading(true);
      try {
        const data = await fetchExamstobeRescheduled();
        setRescheduleExams(data);
      } finally {
        if (showLoading) setIsRescheduleLoading(false);
      }
    },
    haveExamsDay,
    isLoading,
    isRescheduleLoading,
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
    refreshSelectedDateExams: async () => {
      const selectedDate = selectedDateRef.current;
      if (!selectedDate || isWeekend(selectedDate)) {
        setExams([]);
        return;
      }
      await fetchExamsForDate(selectedDate, false);
    },
    selectedDateRef,
    venues,
    allScheduledExams,
  };
}
