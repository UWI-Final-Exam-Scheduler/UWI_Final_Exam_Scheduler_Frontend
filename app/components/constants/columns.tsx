import { Column } from "../types/calendarTypes";

export const TIME_COLUMNS: Column[] = [
  { id: "9", title: "9:00 AM" },
  { id: "1", title: "1:00 PM" },
  { id: "4", title: "4:00 PM" },
];

export const RESCHEDULE_COLUMN: Column = { id: "0", title: "Reschedule Exams" };

export const ALL_COLUMNS: Column[] = [RESCHEDULE_COLUMN, ...TIME_COLUMNS];
