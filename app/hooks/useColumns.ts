import { useState } from "react";
import { Column, Exam } from "../components/types/calendarTypes";
import rawdata from "../testdata/exams.json";

const data = rawdata as { exams: Exam[]; columns: Column[] };

export function useColumns() {
  const [columns] = useState<Column[]>(() => {
    try {
      const storedColumns = localStorage.getItem("columns");
      return storedColumns ? JSON.parse(storedColumns) : data.columns;
    } catch {
      return data.columns;
    }
  });

  return columns;
}
