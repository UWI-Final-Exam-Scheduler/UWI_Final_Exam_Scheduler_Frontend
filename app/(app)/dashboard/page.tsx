"use client";
import dynamic from "next/dynamic";

const CalendarDayPicker = dynamic(
  () => import("@/app/components/ui/CalendarDayPicker"),
  { ssr: false },
);

// import CalendarDayPicker from "@/app/components/ui/CalendarDayPicker";

export default function Dashboard() {
  return (
    <div>
      <CalendarDayPicker />
    </div>
  );
}
