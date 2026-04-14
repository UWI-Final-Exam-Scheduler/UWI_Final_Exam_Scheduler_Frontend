import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/app/components/ui/CalendarDayPicker", () => ({
  default: () => <div data-testid="calendar-day-picker">Calendar</div>,
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    let Component: React.ComponentType | null = null;
    loader().then((mod) => {
      Component = mod.default;
    });
    return function DynamicComponent(props: Record<string, unknown>) {
      if (!Component) return null;
      return <Component {...props} />;
    };
  },
}));

import DashboardPage from "@/app/(app)/dashboard/page";

describe("Dashboard page — integration", () => {
  it("renders without crashing", () => {
    expect(() => render(<DashboardPage />)).not.toThrow();
  });

  it("mounts the CalendarDayPicker", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId("calendar-day-picker")).toBeInTheDocument();
    });
  });
});
