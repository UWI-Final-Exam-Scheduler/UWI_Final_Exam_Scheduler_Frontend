"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCourseClashMatrix } from "@/app/hooks/useCourseClashMatrix";
import CourseClashMatrix from "@/app/components/ui/CourseClashMatrix";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { useThresholds } from "@/app/hooks/useThresholds";

export default function CourseClashMatrixPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseCode = searchParams.get("courseCode") || "";
  const enrolledStudents = Number(searchParams.get("enrolledStudents")) || 0;

  const { percentageThreshold, absoluteThreshold } = useThresholds();

  const { clashes, loading } = useCourseClashMatrix(
    courseCode,
    Number(absoluteThreshold),
    percentageThreshold,
  );

  // Back navigation (preserve applied filters)
  const handleBack = () => {
    const params = new URLSearchParams();
    if (searchParams.get("subject"))
      params.set("subject", searchParams.get("subject")!);
    if (searchParams.get("page")) params.set("page", searchParams.get("page")!);
    if (searchParams.get("courseCodeFilter"))
      params.set("courseCodeFilter", searchParams.get("courseCodeFilter")!);
    if (searchParams.get("clashFilter"))
      params.set("clashFilter", searchParams.get("clashFilter")!);
    const url = `/courses${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url as Route);
  };

  return (
    <div className="flex gap-x-4">
      <main className="flex-1">
        <button
          onClick={handleBack}
          className="flex items-center mb-4 text-blue-600 hover:underline cursor-pointer"
        >
          <ArrowLeft className="mr-2" /> Back to Courses
        </button>
        <h1 className="text-2xl font-bold mb-4">
          Clash Matrix for {courseCode}
        </h1>
        <CourseClashMatrix
          course={courseCode}
          enrolledStudents={enrolledStudents}
          clashes={clashes}
          loading={loading}
        />
      </main>
    </div>
  );
}
