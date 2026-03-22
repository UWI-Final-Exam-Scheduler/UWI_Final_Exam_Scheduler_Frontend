"use client";
import { DayPicker } from "react-day-picker";
import { useMemo, useState } from "react";
import "react-day-picker/style.css";
import ExamDisplayer from "./ExamDisplayer";
import { Box } from "@radix-ui/themes";
import CustomButton from "./CustomButton";
import TimeColumn from "./TimeColumn";
import { DndContext } from "@dnd-kit/core";
import { useRefineCalendar } from "@/app/hooks/useRefineCalendar";
import { useColumns } from "@/app/hooks/useColumns";

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

  const {
    exams,
    alertOpen,
    pendingMove,
    handleExamDrag,
    handleConfirmMove,
    handleCancelMove,
  } = useRefineCalendar();

  const columns = useColumns();
  const rescheduleColumn = columns.find((col) => col.id === "0");

  const filteredExams = useMemo(() => {
    if (!selected) return [];
    const selectedDateStr = [
      selected.getFullYear(),
      String(selected.getMonth() + 1).padStart(2, "0"),
      String(selected.getDate()).padStart(2, "0"),
    ].join("-");

    console.log("selected date string:", selectedDateStr);
    console.log("all exams:", exams);
    console.log(
      "filtered:",
      exams.filter((exam) => exam.date === selectedDateStr),
    );

    return exams.filter((exam) => exam.date === selectedDateStr);
  }, [selected, exams]);

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

  const examDates = useMemo(() => {
    // this is to ensure that the calendar updates when a day becomes empty with no exams after refining
    return exams
      .filter((exam) => exam.timeColumnId !== "0")
      .map((exam) => new Date(exam.date + "T12:00:00"));
  }, [exams]);

  return (
    <DndContext onDragEnd={handleExamDrag}>
      <div className="flex gap-4 p-4">
        <Box className="flex-1" style={{ transition: "all 0.3s ease" }}>
          {!isSelected && !isCollapsed && (
            <div className={hasInteracted ? "motion-preset-slide-down" : ""}>
              <DayPicker
                mode="single"
                numberOfMonths={2}
                selected={selected}
                onSelect={handleDaySelect}
                startMonth={startMonth}
                endMonth={endMonth}
                modifiers={{ hasExam: examDates }}
                modifiersStyles={{
                  hasExam: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    color: "#3b82f6",
                  },
                }}
                style={
                  {
                    "--rdp-accent-color": "#3b82f6",
                    "--rdp-day-width": "60px",
                    "--rdp-day-height": "60px",
                    "--rdp-month-caption-font-size": "1.25rem",
                    "--rdp-weekday-font-size": "1rem",
                  } as React.CSSProperties
                }
              />
            </div>
          )}

          {isSelected && selected && isCollapsed && (
            <div className="motion-preset-slide-up">
              <CustomButton
                buttonname="Select Another Day"
                onclick={selectAnotherDay}
              />
              <ExamDisplayer
                selectedDay={selected}
                exams={filteredExams}
                alertOpen={alertOpen}
                pendingMove={pendingMove}
                handleConfirmMove={handleConfirmMove}
                handleCancelMove={handleCancelMove}
              />
            </div>
          )}
        </Box>

        {rescheduleColumn && (
          <aside className="w-48 shrink-0">
            <TimeColumn
              column={rescheduleColumn}
              exams={exams.filter((exam) => exam.timeColumnId === "0")}
            />
          </aside>
        )}
      </div>
    </DndContext>
  );
}
