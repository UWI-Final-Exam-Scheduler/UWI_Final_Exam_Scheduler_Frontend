import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExamHoverCard from "@/app/components/ui/ExamHoverCard";
import {
  mockClashDetail,
  mockClashExam,
  mockExam,
} from "../mocks/examMockData";

describe("ExamHoverCard", () => {
  it("should show red badge for same-time clashes", async () => {
    const clashDetail = mockClashDetail("same-day-time");

    render(
      <ExamHoverCard clashDetail={clashDetail}>
        <button>Hover me</button>
      </ExamHoverCard>,
    );

    await userEvent.hover(screen.getByRole("button", { name: /hover me/i }));

    const badge = await screen.findByText("Same Time & Day Clash");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#dc2626" });
  });

  it("should show hotpink badge for same-day clashes", async () => {
    const clashDetail = mockClashDetail("sameday");

    render(
      <ExamHoverCard clashDetail={clashDetail}>
        <button>Hover me</button>
      </ExamHoverCard>,
    );

    await userEvent.hover(screen.getByRole("button", { name: /hover me/i }));

    const badge = await screen.findByText("Same-Day Clash");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#f01f88" });
  });

  it("should show orange badge for adjacent-day clashes", async () => {
    const clashDetail = mockClashDetail("adjacent");

    render(
      <ExamHoverCard clashDetail={clashDetail}>
        <button>Hover me</button>
      </ExamHoverCard>,
    );

    await userEvent.hover(screen.getByRole("button", { name: /hover me/i }));

    const badge = await screen.findByText("Adjacent-Day Clash");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "rgb(255, 165, 0)" });
  });

  it("should display students affected, not total enrollment", async () => {
    const clashDetail = {
      clash: "same-day-time" as const,
      clashExams: [
        {
          exam: {
            ...mockExam(),
            courseCode: "MATH1115",
            number_of_students: 130,
          },
          studentsAffected: 12,
        },
      ],
    };

    render(
      <ExamHoverCard clashDetail={clashDetail}>
        <button>Hover me</button>
      </ExamHoverCard>,
    );

    await userEvent.hover(screen.getByRole("button", { name: /hover me/i }));

    expect(await screen.findByText(/12 affected/i)).toBeInTheDocument();
    expect(screen.queryByText("130")).not.toBeInTheDocument();
  });

  it("should render without crashing when clash list is empty", () => {
    const clashDetail = { clash: "same-day-time" as const, clashExams: [] };

    expect(() =>
      render(
        <ExamHoverCard clashDetail={clashDetail}>
          <button>Hover me</button>
        </ExamHoverCard>,
      ),
    ).not.toThrow();
  });
});
