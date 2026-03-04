'use client";';

import CalendarDayPicker from "@/app/components/ui/CalendarDayPicker";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard Page</h1>
      <CalendarDayPicker
        startMonth={new Date(2026, 4)}
        endMonth={new Date(2026, 5)}
      />
    </div>
  );
}
