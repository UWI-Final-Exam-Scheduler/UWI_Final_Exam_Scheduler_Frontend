import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── mock only the external boundary (fetch) and unavoidable jsdom gaps ─────
vi.mock("@radix-ui/themes", () => ({
  Spinner: () => <span data-testid="spinner" />,
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
// Simple stand-ins so we don't depend on Radix internals rendering in jsdom
vi.mock("@/app/components/ui/LoginCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/app/components/ui/CustomTextField", () => ({
  default: ({
    placeholder,
    type,
    value,
    onChange,
  }: {
    placeholder: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <input
      placeholder={placeholder}
      type={type ?? "text"}
      value={value}
      onChange={onChange}
    />
  ),
}));
vi.mock("@/app/components/ui/CustomButton", () => ({
  default: ({ buttonname, type }: { buttonname: string; type?: string }) => (
    <button type={(type as "submit" | "button") ?? "button"}>
      {buttonname}
    </button>
  ),
}));

import LoginPage from "@/app/(auth)/page";
import toast from "react-hot-toast";

const originalFetch = global.fetch;

function mockFetchResponse(
  body: object,
  ok = true,
  status = 200,
): typeof global.fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("Login page — integration", () => {
  let user: ReturnType<typeof userEvent.setup>;
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockClear();
  });

  //rendering
  it("renders username and password fields and the Login button", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
  });

  // client-side validation
  it("shows validation errors when submitted with empty fields", async () => {
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /Login/i }));

    expect(screen.getByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("shows only password error when username is filled", async () => {
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    expect(screen.queryByText("Username is required")).not.toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("does not call fetch when validation fails", async () => {
    global.fetch = vi.fn();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /Login/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // loading state
  it("shows spinner while the API request is in flight", async () => {
    // Never resolves during this test
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /Login/i }));
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  // successful login flow
  it("stores username in localStorage on success", async () => {
    global.fetch = mockFetchResponse({ message: "ok" });
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(localStorage.getItem("username")).toBe("admin");
    });
  });

  it("shows success toast on successful login", async () => {
    global.fetch = mockFetchResponse({ message: "ok" });
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Welcome Back 👋");
    });
  });

  it("redirects to /dashboard after 800 ms on success", async () => {
    global.fetch = mockFetchResponse({ message: "ok" });
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    await waitFor(() => expect(window.location.href).toBe("/dashboard"), {
      timeout: 1500,
    });
  });

  // API error responses
  it("displays the server error message on a failed login", async () => {
    global.fetch = mockFetchResponse(
      { error: "Invalid credentials" },
      false,
      401,
    );
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows a generic error when server returns no message", async () => {
    global.fetch = mockFetchResponse({}, false, 500);
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });

  it("shows a network error message when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Network error when attempting to login"),
      ).toBeInTheDocument();
    });
  });

  it("hides the spinner after the request completes", async () => {
    global.fetch = mockFetchResponse({ error: "Bad credentials" }, false, 401);
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Username"), "admin");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
  });
});
