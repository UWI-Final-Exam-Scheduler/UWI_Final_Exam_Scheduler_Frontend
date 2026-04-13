import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// CalendarDayPicker uses many calendar/drag-drop/Zustand dependencies.
// The integration boundary here is the dynamic import mechanism — we verify
// the page loads the component and hands off rendering to it.
vi.mock("@/app/components/ui/CalendarDayPicker", () => ({
  default: () => <div data-testid="calendar-day-picker">Calendar</div>,
}));

// next/dynamic resolves to the same module in the test environment
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Execute the loader synchronously so the dynamic component renders
    // immediately without a Suspense boundary gap
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
