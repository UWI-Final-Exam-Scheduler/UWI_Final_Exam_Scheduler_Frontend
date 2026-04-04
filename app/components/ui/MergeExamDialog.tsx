"use client";

import { useState, useEffect } from "react";
import ExamActionDialog from "./ExamActionDialog";
import { Exam } from "../types/calendarTypes";

type MergeDialogProps = {
  exam: Exam | null;
  splits: Exam[];
  open: boolean;
  onConfirm: (examIds: number[]) => Promise<void>;
  onCancel: () => void;
};

export default function MergeExamDialog({
  exam,
  splits,
  open,
  onConfirm,
  onCancel,
}: MergeDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    const idSet = new Set(splits.map((s) => s.id));
    const handle = setTimeout(() => setSelected(idSet), 0);

    return () => clearTimeout(handle);
  }, [open, splits]);

  if (!exam) return null;

  const isSimple = splits.length === 2;
  const selectedSplits = splits.filter((s) => selected.has(s.id));
  const totalStudents = selectedSplits.reduce(
    (sum, s) => sum + s.number_of_students,
    0,
  );

  function toggleSplit(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <ExamActionDialog
      open={open}
      title={`Merge ${exam.courseCode} Splits`}
      confirmLabel="Confirm Merge"
      confirmDisabled={selected.size < 2}
      confirmColor="green"
      onConfirm={() => onConfirm([...selected])}
      onCancel={onCancel}
    >
      {isSimple ? (
        <p className="text-sm text-gray-600">
          Merge both splits? Combined total: <strong>{totalStudents}</strong>{" "}
          students.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Select splits to merge (minimum 2):
          </p>
          <div className="mb-3 flex flex-col gap-2">
            {splits.map((split) => (
              <label
                key={split.id}
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={selected.has(split.id)}
                  onChange={() => toggleSplit(split.id)}
                  className="h-4 w-4 accent-green-500"
                />
                <span className="text-sm text-gray-700">
                  Venue ID {split.venue_id} — {split.number_of_students}{" "}
                  students
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Combined total: <strong>{totalStudents}</strong> students
          </p>
        </>
      )}
    </ExamActionDialog>
  );
}
