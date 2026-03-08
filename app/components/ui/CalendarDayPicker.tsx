"use client";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { useState } from "react";
import "react-day-picker/style.css";
import ExamDisplayer from "./ExamDisplayer";
import { Box } from "@radix-ui/themes";
import CustomButton from "./CustomButton";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleDaySelect = (selectedDay: Date | undefined) => {
    setSelected(selectedDay);
    setIsSelected(true);
    setIsCollapsed(true);
    setHasInteracted(true);
  };

  const selectAnotherDay = () => {
    setIsSelected(false);
    setIsCollapsed(false);
    setSelected(undefined);
  };

  return (
    <div>
      <Box
        style={{
          transition: "all 0.3s ease",
        }}
      >
        {!isSelected && !isCollapsed && (
          <div className={hasInteracted ? "motion-preset-slide-down" : ""}>
            <DayPicker
              mode="single"
              numberOfMonths={2}
              selected={selected}
              onSelect={handleDaySelect}
              startMonth={startMonth}
              endMonth={endMonth}
              style={{ "--rdp-accent-color": "#3b82f6" } as React.CSSProperties}
            />
          </div>
        )}

        {isSelected && selected && isCollapsed && (
          <div className="motion-preset-slide-up">
            <CustomButton
              buttonname="Select Another Day"
              onclick={selectAnotherDay}
            />
            <ExamDisplayer selectedDay={selected} />
          </div>
        )}
      </Box>
    </div>
  );
}
