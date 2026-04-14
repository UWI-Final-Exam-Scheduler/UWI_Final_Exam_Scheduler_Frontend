import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Exam, Venue } from "@/app/components/types/calendarTypes";

const {
  mockSave,
  mockText,
  mockSetFontSize,
  mockDoc,
  mockAutoTableFn,
  MockJsPDF,
} = vi.hoisted(() => {
  const mockSave = vi.fn();
  const mockText = vi.fn();
  const mockSetFontSize = vi.fn();

  const mockDoc = {
    setFontSize: mockSetFontSize,
    text: mockText,
    save: mockSave,
  };

  const mockAutoTableFn = vi.fn();
  const MockJsPDF = vi.fn(function MockJsPDFImpl() {
    return mockDoc;
  });

  return {
    mockSave,
    mockText,
    mockSetFontSize,
    mockDoc,
    mockAutoTableFn,
    MockJsPDF,
  };
});

// ── reference the hoisted spies directly — no new vi.fn() calls here ──────
vi.mock("jspdf", () => ({ default: MockJsPDF }));
vi.mock("jspdf-autotable", () => ({ default: mockAutoTableFn }));

import { exportExamsToPDF } from "@/app/lib/exportExamsToPDF";

// ── fixtures ───────────────────────────────────────────────────────────────
const mockVenues: Venue[] = [
  { id: 1, name: "Hall A", capacity: 100 },
  { id: 2, name: "Hall B", capacity: 150 },
];

const makeExam = (overrides: Partial<Exam> = {}): Exam => ({
  id: 1,
  courseCode: "COMP3603",
  exam_date: "2024-03-15",
  date: null,
  time: 9,
  venue_id: 1,
  number_of_students: 50,
  timeColumnId: "9",
  exam_length: 2,
  ...overrides,
});

const mockExams: Exam[] = [
  makeExam({
    id: 1,
    courseCode: "COMP3603",
    time: 9,
    venue_id: 1,
    number_of_students: 50,
  }),
  makeExam({
    id: 2,
    courseCode: "MATH2150",
    time: 1,
    venue_id: 2,
    number_of_students: 60,
    timeColumnId: "1",
  }),
];

describe("exportExamsToPDF", () => {
  beforeEach(() => {
    MockJsPDF.mockClear();
    mockSave.mockClear();
    mockText.mockClear();
    mockSetFontSize.mockClear();
    mockAutoTableFn.mockClear();
  });

  it("creates a PDF document in landscape orientation", () => {
    exportExamsToPDF(mockExams, mockVenues);
    expect(MockJsPDF).toHaveBeenCalledWith("landscape");
  });

  it('saves the PDF with filename "exam_schedule.pdf"', () => {
    exportExamsToPDF(mockExams, mockVenues);
    expect(mockSave).toHaveBeenCalledWith("exam_schedule.pdf");
  });

  it("sorts exams by date first, then by time", () => {
    const unsorted: Exam[] = [
      makeExam({
        id: 1,
        courseCode: "COMP3603",
        exam_date: "2024-03-16",
        time: 9,
        timeColumnId: "9",
      }),
      makeExam({
        id: 2,
        courseCode: "MATH2150",
        exam_date: "2024-03-15",
        time: 4,
        timeColumnId: "4",
      }),
      makeExam({
        id: 3,
        courseCode: "INFO3606",
        exam_date: "2024-03-15",
        time: 1,
        timeColumnId: "1",
      }),
    ];

    exportExamsToPDF(unsorted, mockVenues);

    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    // Sorted: 15/03 time-1, 15/03 time-4, 16/03 time-9
    expect(tableData[0][0]).toBe("INFO3606");
    expect(tableData[1][0]).toBe("MATH2150");
    expect(tableData[2][0]).toBe("COMP3603");
  });

  it("formats YYYY-MM-DD dates in en-GB locale without timezone shift", () => {
    exportExamsToPDF(mockExams, mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData[0][1]).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('formats time 9 as "9:00 AM"', () => {
    exportExamsToPDF([makeExam({ time: 9, timeColumnId: "9" })], mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData[0][2]).toBe("9:00 AM");
  });

  it('formats time 1 as "1:00 PM"', () => {
    exportExamsToPDF([makeExam({ time: 1, timeColumnId: "1" })], mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData[0][2]).toBe("1:00 PM");
  });

  it('formats time 4 as "4:00 PM"', () => {
    exportExamsToPDF([makeExam({ time: 4, timeColumnId: "4" })], mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData[0][2]).toBe("4:00 PM");
  });

  it('formats unknown time slots as "Unknown"', () => {
    exportExamsToPDF([makeExam({ time: 99, timeColumnId: "99" })], mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData[0][2]).toBe("Unknown");
  });

  it("looks up venue names by ID", () => {
    exportExamsToPDF(mockExams, mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData.some((row) => row[3] === "Hall A")).toBe(true);
    expect(tableData.some((row) => row[3] === "Hall B")).toBe(true);
  });

  it('shows "Unknown" when venue ID has no match', () => {
    exportExamsToPDF([makeExam({ venue_id: 999 })], mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData[0][3]).toBe("Unknown");
  });

  it("passes the correct column headers to autoTable", () => {
    exportExamsToPDF(mockExams, mockVenues);
    const headers = mockAutoTableFn.mock.calls[0][1].head[0] as string[];
    expect(headers).toEqual(["Course", "Date", "Time", "Venue", "Students"]);
  });

  it("converts student count to a string in the table", () => {
    exportExamsToPDF(mockExams, mockVenues);
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    tableData.forEach((row) => {
      expect(typeof row[4]).toBe("string");
      expect(/^\d+$/.test(row[4])).toBe(true);
    });
  });

  it("does not throw for invalid date strings", () => {
    expect(() =>
      exportExamsToPDF([makeExam({ exam_date: "not-a-date" })], mockVenues),
    ).not.toThrow();
  });

  it("handles an empty exam list without throwing", () => {
    expect(() => exportExamsToPDF([], mockVenues)).not.toThrow();
    const tableData = mockAutoTableFn.mock.calls[0][1].body as string[][];
    expect(tableData).toHaveLength(0);
  });

  it("writes the page title via didDrawPage callback", () => {
    exportExamsToPDF(mockExams, mockVenues);

    const options = mockAutoTableFn.mock.calls[0][1];
    options.didDrawPage();

    expect(mockSetFontSize).toHaveBeenCalledWith(12);
    expect(mockText).toHaveBeenCalledWith("UWI Final Exam Schedule", 14, 10);
  });
});
