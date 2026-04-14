import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiPut } from "@/app/lib/apiPut";
import { apiFetch } from "@/app/lib/apiFetch";

vi.mock("@/app/lib/apiFetch", () => ({
  apiFetch: vi.fn(),
}));

describe("apiPut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a PUT request with a JSON body", async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response("ok", { status: 200 }));

    await apiPut("/api/courses/COMP1601", {
      name: "Software Engineering",
    });

    expect(apiFetch).toHaveBeenCalledWith("/api/courses/COMP1601", {
      method: "PUT",
      body: JSON.stringify({ name: "Software Engineering" }),
    });
  });

  it("returns the fetch response", async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    vi.mocked(apiFetch).mockResolvedValue(response);

    await expect(apiPut("/api/test", { hello: "world" })).resolves.toBe(
      response,
    );
  });
});
