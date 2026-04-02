"use client";

import React from "react";
import { Column as ColumnType, Exam, Venue } from "../types/calendarTypes";
import ExamCardDnD from "./ExamCardDnD";
import { useDroppable } from "@dnd-kit/core";
import { Spinner } from "@radix-ui/themes";

function DroppableSlot({
  droppableId,
  label,
  exams,
  clashColorMap,
}: {
  droppableId: string;
  label?: string;
  exams: Exam[];
  clashColorMap?: Map<number, "orange" | "hotpink">;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-semibold text-gray-700 truncate px-1">
          {label}
        </span>
      )}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[60px] rounded-lg p-2 transition-colors border ${
          isOver
            ? "bg-blue-50 border-blue-300 border-dashed"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {exams.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">Drop here</p>
        ) : (
          exams.map((exam) => (
            <ExamCardDnD
              key={exam.id}
              exam={exam}
              clashColor={clashColorMap?.get(exam.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type TimeColumnProps = {
  column: ColumnType;
  exams: Exam[];
  venues?: Venue[];
  isLoading?: boolean;
  clashColorMap?: Map<number, "orange" | "hotpink">;
};

export default function TimeColumn({
  column,
  exams,
  venues = [],
  isLoading,
  clashColorMap,
}: TimeColumnProps) {
  const isReschedule = column.id === "0";

  return (
    <div className="flex flex-col gap-3 border rounded-xl p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">{column.title}</h2>
        <span className="text-xs text-gray-500 font-medium">
          {exams.length} exam{exams.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <Spinner />
        </div>
      ) : isReschedule || venues.length === 0 ? (
        <DroppableSlot
          droppableId={column.id}
          exams={exams}
          clashColorMap={clashColorMap}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {venues.map((venue) => (
            <DroppableSlot
              key={`venue-${venue.name}`}
              droppableId={`${column.id}-${venue.id}`}
              label={venue.name}
              exams={exams.filter((e) => e.venue_id === venue.id)}
              clashColorMap={clashColorMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
