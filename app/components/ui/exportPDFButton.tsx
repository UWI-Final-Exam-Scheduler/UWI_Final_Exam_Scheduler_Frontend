"use client";

import { useState } from "react";
import { exportExamsToPDF } from "@/app/lib/exportExamsToPDF";
import {
  get_days_with_exams,
  examFetchbyDate,
} from "@/app/lib/examFetch";
import { venueFetch } from "@/app/lib/venueFetch";
import { Exam, Venue } from "@/app/components/types/calendarTypes";

export default function ExportPDFButton() {
  const [loading, setLoading] = useState(false);

  const fetchAllExams = async (): Promise<Exam[]> => {
    const days: string[] = await get_days_with_exams();

    const results = await Promise.allSettled(
      days.map((day) => examFetchbyDate(day))
    );

    const all: Exam[] = [];

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        all.push(
          ...res.value.map((exam: Exam) => ({
            ...exam,
            timeColumnId: String(exam.time),
          }))
        );
      }
    });

    return all;
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const [exams, venues] = await Promise.all([
        fetchAllExams(),
        venueFetch(),
      ]);

      exportExamsToPDF(exams, venues);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {loading ? "Exporting..." : "Export PDF"}
    </button>
  );
}