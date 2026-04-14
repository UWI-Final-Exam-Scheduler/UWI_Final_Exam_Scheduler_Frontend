import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@radix-ui/themes", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/app/lib/apiFetch", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/app/lib/activityLog", () => ({
  addLog: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import LogoutButton from "@/app/components/ui/LogoutButton";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/apiFetch";
import { addLog } from "@/app/lib/activityLog";
import toast from "react-hot-toast";

describe("LogoutButton - integration", () => {
  const push = vi.fn();
  const refresh = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push,
      refresh,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    });
    localStorage.setItem("username", "admin");
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
    localStorage.clear();
  });

  it("logs the user out on success", async () => {
    const timeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation(((callback: TimerHandler) => {
        if (typeof callback === "function") {
          callback();
        }
        return 0 as unknown as number;
      }) as typeof setTimeout);

    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    } as Response);

    try {
      render(<LogoutButton />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Logout" }));
        await Promise.resolve();
      });

      expect(apiFetch).toHaveBeenCalledWith("/api/logout", { method: "GET" });
      expect(addLog).toHaveBeenCalledWith({
        action: "User Logout",
        entityId: "admin",
      });
      expect(vi.mocked(toast.success)).toHaveBeenCalled();
      expect(localStorage.getItem("username")).toBeNull();
      expect(push).toHaveBeenCalledWith("/");
      expect(refresh).toHaveBeenCalled();
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it("shows an error toast when logout fails", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server error"),
    } as Response);

    render(<LogoutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Logout" }));
      await Promise.resolve();
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Logout failed. Please try again.",
    );
  });
});
