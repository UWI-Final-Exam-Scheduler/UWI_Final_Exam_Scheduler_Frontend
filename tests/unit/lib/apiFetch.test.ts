import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/app/lib/apiFetch";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds JSON content type and include credentials by default", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    await apiFetch("/api/test");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        credentials: "include",
      }),
    );

    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("keeps an existing content type header", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    await apiFetch("/api/test", {
      headers: { "Content-Type": "text/plain" },
    });

    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("content-type")).toBe("text/plain");
  });

  it("does not force a JSON content type for FormData", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const formData = new FormData();
    formData.append("file", new Blob(["hello"]), "hello.txt");

    await apiFetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("content-type")).toBeNull();
  });
});
