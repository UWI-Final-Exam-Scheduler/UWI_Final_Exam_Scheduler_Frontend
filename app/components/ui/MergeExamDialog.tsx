"use client";

import { useState } from "react";
import ExamActionDialog from "./ExamActionDialog";
import { Exam, Venue } from "../types/calendarTypes";
import { useMergeSelection } from "@/app/hooks/useMergeSelection";

type MergeDialogProps = {
  exam: Exam | null;
  splits: Exam[];
  open: boolean;
  onConfirm: (examIds: number[]) => Promise<void>;
  onCancel: () => void;
  venues?: Venue[];
  occupancyMap?: Record<number, Record<string, number>>;
};

export default function MergeExamDialog({
  exam,
  splits,
  open,
  onConfirm,
  onCancel,
  venues = [],
  occupancyMap = {},
}: MergeDialogProps) {
  const { selected, totalStudents, toggleSplit } = useMergeSelection(splits);

  const selectedSplits = splits.filter((s) => selected.has(s.id));
  const firstSplit = selectedSplits[0];
  const mergeVenueId = firstSplit?.venue_id;
  const mergeTimeColumnId = firstSplit?.timeColumnId;

  const venue = venues?.find((v) => v.id === mergeVenueId);
  const currentOccupancy =
    occupancyMap?.[mergeVenueId]?.[mergeTimeColumnId] ?? 0;
  const currentSplitTotal = selectedSplits.reduce(
    (sum, s) => sum + s.number_of_students,
    0,
  );
  const wouldExceed =
    currentOccupancy - currentSplitTotal + totalStudents >
    (venue?.capacity ?? 0);

  if (!exam) return null;
  const isSimple = splits.length === 2;

  return (
    <ExamActionDialog
      open={open}
      title={`Merge ${exam.courseCode} Splits`}
      confirmLabel={
        wouldExceed ? "Merge & Move to Reschedule" : "Confirm Merge"
      }
      confirmDisabled={selected.size < 2}
      confirmColor="blue"
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
                  className="h-4 w-4 accent-blue-500"
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

          {wouldExceed && selectedSplits.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
              <p className="font-semibold mb-1">Capacity Overflow</p>
              <p>
                Merging creates <strong>{totalStudents}</strong> students, but
                {venue?.name} capacity is <strong>{venue?.capacity}</strong>.
              </p>
              <p className="text-xs mt-2">
                Exam will move to `To Be Rescheduled`
              </p>
            </div>
          )}
        </>
      )}
    </ExamActionDialog>
  );
}
