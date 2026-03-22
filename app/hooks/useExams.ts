import rawdata from "../testdata/exams.json";
import { Exam } from "../components/types/calendarTypes";
import { useState } from "react";

const data = rawdata as { exams: Exam[] };

export function useExams() {
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const storedExams = localStorage.getItem("exams");
      if (storedExams) {
        return JSON.parse(storedExams);
      }
    } catch (error) {
      console.error("Error loading exams from localStorage:", error);
    }
    return data.exams;
  });

  return { exams, setExams };
}
