"use client";

import { useState } from "react";
import ExamActionDialog from "./ExamActionDialog";
import { Exam, Venue } from "../types/calendarTypes";
import { useMergeSelection } from "@/app/hooks/useMergeSelection";

type MergeDialogProps = {
  exam: Exam | null;
  splits: Exam[];
  open: boolean;
  onConfirm: (examIds: number[], moveToReschedule?: boolean) => Promise<void>;
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
  const activeVenue = venues.find((v) => v.id === exam?.venue_id);
  const isScheduled = exam?.timeColumnId !== "0";
  const getVenueLabel = (venueId: number) =>
    venues.find((v) => v.id === venueId)?.name ?? `Venue ID ${venueId}`;
  const wouldExceed = Boolean(
    isScheduled && activeVenue && totalStudents > activeVenue.capacity,
  );

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
      onConfirm={() => onConfirm([...selected], wouldExceed)}
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
                  {getVenueLabel(split.venue_id)} — {split.number_of_students}{" "}
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
                {activeVenue?.name} capacity is{" "}
                <strong>{activeVenue?.capacity}</strong>.
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
