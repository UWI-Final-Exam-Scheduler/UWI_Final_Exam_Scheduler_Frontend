import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaginationControls } from "@/app/components/ui/PaginationControls";

vi.mock("@/app/components/ui/CustomButton", () => ({
  default: ({
    buttonname,
    onclick,
    disabled,
  }: {
    buttonname: string;
    onclick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onclick} disabled={disabled}>
      {buttonname}
    </button>
  ),
}));

describe("PaginationControls", () => {
  const onPageChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("displays current page and total pages", () => {
    render(
      <PaginationControls
        page={2}
        totalPages={5}
        hasNext
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText("Page 2 / 5")).toBeInTheDocument();
  });

  it("calls onPageChange(page + 1) when Next is clicked", () => {
    render(
      <PaginationControls
        page={2}
        totalPages={5}
        hasNext
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange(page - 1) when Previous is clicked", () => {
    render(
      <PaginationControls
        page={3}
        totalPages={5}
        hasNext
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables Previous and First on the first page", () => {
    render(
      <PaginationControls
        page={1}
        totalPages={5}
        hasNext
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /First/i })).toBeDisabled();
  });

  it("disables Next and Last on the last page", () => {
    render(
      <PaginationControls
        page={5}
        totalPages={5}
        hasNext={false}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Last/i })).toBeDisabled();
  });

  it("calls onPageChange(1) when First is clicked", () => {
    render(
      <PaginationControls
        page={4}
        totalPages={5}
        hasNext
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /First/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange(totalPages) when Last is clicked", () => {
    render(
      <PaginationControls
        page={2}
        totalPages={5}
        hasNext
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Last/i }));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });
});
