import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Exam, Venue } from "@/app/components/types/calendarTypes";

function parseExamDate(dateStr: string): Date {
  // Prevent timezone shifts for plain YYYY-MM-DD values from backend.
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  }

  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatTime(time: number): string {
  switch (time) {
    case 9:
      return "9:00 AM";
    case 1:
      return "1:00 PM";
    case 4:
      return "4:00 PM";
    default:
      return "Unknown";
  }
}

function formatDate(dateStr: string): string {
  const d = parseExamDate(dateStr);
  return d.toLocaleDateString("en-GB");
}

export function exportExamsToPDF(exams: Exam[], venues: Venue[]) {
  const doc = new jsPDF("landscape");

  const venueMap = new Map<number, string>();
  venues.forEach((v) => venueMap.set(v.id, v.name));

  const sorted = [...exams].sort((a, b) => {
    const dateDiff =
      parseExamDate(a.exam_date).getTime() -
      parseExamDate(b.exam_date).getTime();

    if (dateDiff !== 0) return dateDiff;

    return a.time - b.time;
  });

  const tableData = sorted.map((e) => [
    e.courseCode,
    formatDate(e.exam_date),
    formatTime(e.time),
    venueMap.get(e.venue_id) || "Unknown",
    e.number_of_students.toString(),
  ]);

  autoTable(doc, {
    head: [["Course", "Date", "Time", "Venue", "Students"]],
    body: tableData,

    styles: {
      fontSize: 8,
    },

    headStyles: {
      fillColor: [41, 128, 185],
    },

    margin: { top: 15 },

    didDrawPage: () => {
      doc.setFontSize(12);
      doc.text("UWI Final Exam Schedule", 14, 10);
    },
  });

  doc.save("exam_schedule.pdf");
}
