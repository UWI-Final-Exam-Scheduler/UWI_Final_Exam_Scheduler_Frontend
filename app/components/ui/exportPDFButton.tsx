"use client";

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { exportExamsToPDF } from "@/app/lib/exportExamsToPDF";
import { get_days_with_exams, examFetchbyDate } from "@/app/lib/examFetch";
import { venueFetch } from "@/app/lib/venueFetch";
import { Exam } from "@/app/components/types/calendarTypes";

export default function ExportPDFButton() {
  const [loading, setLoading] = useState(false);

  const fetchAllExams = async (): Promise<Exam[]> => {
    const days: string[] = await get_days_with_exams();

    const results = await Promise.allSettled(
      days.map((day) => examFetchbyDate(day)),
    );

    const all: Exam[] = [];

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        all.push(
          ...res.value.map((exam: Exam) => ({
            ...exam,
            timeColumnId: String(exam.time),
          })),
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
    <Button
      onClick={handleExport}
      disabled={loading}
      variant="solid"
      color="blue"
      radius="large"
      size="2"
      className="font-bold"
      style={{ cursor: loading ? "not-allowed" : "pointer" }}
    >
      {loading ? "Exporting..." : "Export PDF"}
    </Button>
  );
}
