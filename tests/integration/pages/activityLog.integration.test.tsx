import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/app/lib/activityLog", () => ({
  getLogs: vi.fn(),
}));

vi.mock("@/app/lib/venueFetch", () => ({
  venueFetch: vi.fn(),
}));

import ActivityLogPage from "@/app/(app)/activityLog/page";
import { getLogs } from "@/app/lib/activityLog";
import { venueFetch } from "@/app/lib/venueFetch";

describe("ActivityLog page - integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(venueFetch).mockResolvedValue([
      { id: 1, name: "MD2" },
      { id: 2, name: "JFK" },
    ]);
  });

  it("renders the empty state when there are no logs", async () => {
    vi.mocked(getLogs).mockReturnValue([]);

    render(<ActivityLogPage />);

    await waitFor(() => {
      expect(screen.getByText("No Activity Logs Available")).toBeInTheDocument();
    });
  });

  it("renders logs and resolves venue ids to names", async () => {
    vi.mocked(getLogs).mockReturnValue([
      {
        id: "1",
        action: "Move Exam Same Day",
        entityId: "COMP1601",
        oldValue: "Venue: 1",
        newValue: "Venue: 2",
        timestamp: 1_700_000_000_000,
      },
    ]);

    render(<ActivityLogPage />);

    await waitFor(() => {
      expect(screen.getByText("Move Exam Same Day")).toBeInTheDocument();
      expect(screen.getByText("COMP1601")).toBeInTheDocument();
      expect(screen.getByText("Venue: MD2")).toBeInTheDocument();
      expect(screen.getByText("Venue: JFK")).toBeInTheDocument();
    });
  });
});
