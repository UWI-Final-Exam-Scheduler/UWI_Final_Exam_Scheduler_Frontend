"use client";

import { useEffect, useState } from "react";
import ExamActionDialog from "./ExamActionDialog";
import { Exam } from "../types/calendarTypes";
import { useSplitAllocation } from "@/app/hooks/useSplitAllocation";

type SplitEntry = { number_of_students: number };

type SplitEntryProps = {
  exam: Exam | null;
  open: boolean;
  onConfirm: (splits: SplitEntry[]) => Promise<void>;
  onCancel: () => void;
};

export default function SplitExamDialog({
  exam,
  open,
  onConfirm,
  onCancel,
}: SplitEntryProps) {
  const [splits, setSplits] = useState<SplitEntry[]>([
    { number_of_students: 0 },
    { number_of_students: 0 },
  ]);

  const total = exam?.number_of_students ?? 0;
  const { allocated, remaining, isValid } = useSplitAllocation(splits, total);

  if (!exam) return null;

  function updateSplit(i: number, value: number) {
    setSplits((prev) =>
      prev.map((s, idx) => (idx === i ? { number_of_students: value } : s)),
    );
  }

  return (
    <ExamActionDialog
      open={open}
      title={`Split ${exam.courseCode}`}
      confirmLabel="Confirm Split"
      confirmDisabled={!isValid}
      onConfirm={() => onConfirm(splits)}
      onCancel={onCancel}
    >
      <p className="mb-3 text-sm text-gray-500">
        Total: <strong>{total}</strong> — Remaining:{" "}
        <strong className={remaining < 0 ? "text-red-500" : ""}>
          {remaining}
        </strong>
      </p>

      <div className="mb-3 flex flex-col gap-2">
        {splits.map((split, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-sm text-gray-600">
              Split {i + 1}
            </span>
            <input
              type="number"
              min={1}
              max={total}
              value={split.number_of_students || ""}
              onChange={(e) => updateSplit(i, Number(e.target.value))}
              className="w-28 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Students"
            />
            {splits.length > 2 && (
              <button
                type="button"
                onClick={() =>
                  setSplits((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {splits.length < 4 && (
        <button
          type="button"
          onClick={() =>
            setSplits((prev) => [...prev, { number_of_students: 0 }])
          }
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          + Add Split
        </button>
      )}
    </ExamActionDialog>
  );
}
