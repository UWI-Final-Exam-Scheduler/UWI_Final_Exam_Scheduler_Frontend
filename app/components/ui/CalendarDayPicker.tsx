"use client";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { useState } from "react";
import "react-day-picker/style.css";
import ExamDisplayer from "./ExamDisplayer";

type CalendarProps = {
  startMonth: Date;
  endMonth: Date;
};
export default function CalendarDayPicker({
  startMonth,
  endMonth,
}: CalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [isSelected, setIsSelected] = useState(false);
  const defaultClassNames = getDefaultClassNames();

  const handleDaySelect = (selectedDay: Date | undefined) => {
    setSelected(selectedDay);
    setIsSelected(true);
  };

  return (
    <div>
      <DayPicker
        mode="single"
        numberOfMonths={2}
        selected={selected}
        onSelect={handleDaySelect}
        startMonth={startMonth}
        endMonth={endMonth}
        style={
          {
            "--rdp-accent-color": "#3b82f6", // change this to the ring color you want
          } as React.CSSProperties
        }
      />
      {isSelected && selected && (
        <div>
          <p className="mt-4 text-center">
            You selected:{" "}
            <span className="font-bold">{selected.toLocaleDateString()}</span>
          </p>
          <ExamDisplayer selectedDay={selected} />
        </div>
      )}
    </div>
  );
}
