import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

vi.mock("@/app/components/ui/Sidebar", () => ({
  default: () => <aside data-testid="sidebar" />,
}));

vi.mock("@/app/components/ui/LogoutButton", () => ({
  default: () => <button type="button">Logout</button>,
}));

vi.mock("@/app/components/ui/exportPDFButton", () => ({
  default: () => <button type="button">Export PDF</button>,
}));

import AppLayout from "@/app/(app)/layout";

describe("App layout - integration", () => {
  it("renders the shared shell around page content", () => {
    render(
      <AppLayout>
        <main>Dashboard content</main>
      </AppLayout>,
    );

    expect(screen.getByText("Exam Scheduler")).toBeInTheDocument();
    expect(screen.getByAltText("UWI Logo")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});
