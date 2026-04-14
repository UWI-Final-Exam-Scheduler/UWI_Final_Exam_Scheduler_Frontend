import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

vi.mock("@radix-ui/themes", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/app/lib/exportExamsToPDF", () => ({
  exportExamsToPDF: vi.fn(),
}));

vi.mock("@/app/lib/examFetch", () => ({
  get_days_with_exams: vi.fn(),
  examFetchbyDate: vi.fn(),
}));

vi.mock("@/app/lib/venueFetch", () => ({
  venueFetch: vi.fn(),
}));

import ExportPDFButton from "@/app/components/ui/exportPDFButton";
import { exportExamsToPDF } from "@/app/lib/exportExamsToPDF";
import { examFetchbyDate, get_days_with_exams } from "@/app/lib/examFetch";
import { venueFetch } from "@/app/lib/venueFetch";

describe("ExportPDFButton - integration", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    vi.mocked(get_days_with_exams).mockResolvedValue(["2025-05-12"]);
    vi.mocked(examFetchbyDate).mockResolvedValue([
      {
        id: 1,
        courseCode: "COMP1601",
        exam_date: "2025-05-12",
        date: "2025-05-12",
        time: 9,
        timeColumnId: "9",
        venue_id: 1,
        exam_length: 120,
        number_of_students: 45,
      },
    ]);
    vi.mocked(venueFetch).mockResolvedValue([
      { id: 1, name: "MD2", capacity: 100 },
    ]);
  });

  it("collects exams and venues then exports a pdf", async () => {
    render(<ExportPDFButton />);

    await user.click(screen.getByRole("button", { name: "Export PDF" }));

    await waitFor(() => {
      expect(exportExamsToPDF).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            courseCode: "COMP1601",
            timeColumnId: "9",
          }),
        ],
        [{ id: 1, name: "MD2", capacity: 100 }],
      );
    });
  });

  it("shows a loading label while export is in progress", async () => {
    vi.mocked(get_days_with_exams).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<ExportPDFButton />);

    await user.click(screen.getByRole("button", { name: "Export PDF" }));

    expect(screen.getByRole("button", { name: "Exporting..." })).toBeDisabled();
  });
});
