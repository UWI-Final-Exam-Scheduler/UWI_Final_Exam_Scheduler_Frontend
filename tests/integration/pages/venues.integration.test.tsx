import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/app/lib/apiFetch", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@radix-ui/themes", () => ({
  Spinner: () => <span data-testid="spinner" />,
}));

vi.mock("@/app/components/ui/VenueSelect", () => ({
  default: ({
    data,
    onChange,
  }: {
    data: { name: string; capacity: number }[];
    onChange?: (venueName: string | null) => void;
  }) => (
    <div>
      <div data-testid="venue-select-mock">
        {data.map((venue) => (
          <button key={venue.name} onClick={() => onChange?.(venue.name)}>
            {venue.name}
          </button>
        ))}
        <button onClick={() => onChange?.(null)}>All</button>
      </div>
    </div>
  ),
}));

vi.mock("@/app/components/ui/CustomCard", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="venue-card">{children}</div>
  ),
}));

import VenuesPage from "@/app/(app)/venues/page";
import { apiFetch } from "@/app/lib/apiFetch";

describe("Venues page - integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { name: "MD2", capacity: 100 },
          { name: "JFK", capacity: 150 },
        ]),
    } as Response);
  });

  it("renders the loaded venue cards", async () => {
    render(<VenuesPage />);

    await waitFor(() => {
      expect(screen.getByText("Venues")).toBeInTheDocument();
      expect(screen.getAllByTestId("venue-card")).toHaveLength(2);
    });
  });

  it("fetches venue details when a venue is selected", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { name: "MD2", capacity: 100 },
            { name: "JFK", capacity: 150 },
          ]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: "JFK", capacity: 999 }),
      } as Response);

    render(<VenuesPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("venue-card")).toHaveLength(2);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "JFK" }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/api/venues/JFK");
    });

    expect(await screen.findByText("Capacity: 999")).toBeInTheDocument();
  });

  it("shows an error when the initial fetch fails", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response);

    render(<VenuesPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch venues")).toBeInTheDocument();
    });
  });
});
