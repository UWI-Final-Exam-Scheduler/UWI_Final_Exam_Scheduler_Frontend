import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getLogs,
  addLog,
  clearLogs,
  type LogEntry,
} from "@/app/lib/activityLog";

describe("activityLog", () => {
  const mockStorage = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    mockStorage.clear();
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
    });
    // Mock crypto.randomUUID
    vi.stubGlobal("crypto", {
      randomUUID: () => "test-uuid-123",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("addLog", () => {
    it("creates a new log entry with auto-generated ID and timestamp", () => {
      const entry = addLog({
        action: "Test Action",
        entityId: "test-123",
        oldValue: "old",
        newValue: "new",
      });

      expect(entry.id).toBe("test-uuid-123");
      expect(entry.action).toBe("Test Action");
      expect(entry.entityId).toBe("test-123");
      expect(entry.oldValue).toBe("old");
      expect(entry.newValue).toBe("new");
      expect(typeof entry.timestamp).toBe("number");
      expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("stores the new log at the beginning of the array", () => {
      const first = addLog({ action: "First" });
      const second = addLog({ action: "Second" });

      const logs = getLogs();
      expect(logs[0].action).toBe("Second");
      expect(logs[1].action).toBe("First");
    });

    it("stores logs in localStorage", () => {
      addLog({ action: "Test" });

      const stored = JSON.parse(mockStorage.getItem("activity_log") || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].action).toBe("Test");
    });

    it("handles entries without oldValue or newValue", () => {
      const entry = addLog({
        action: "Simple Action",
        entityId: "entity-1",
      });

      expect(entry.oldValue).toBeUndefined();
      expect(entry.newValue).toBeUndefined();
    });
  });

  describe("getLogs", () => {
    it("returns empty array when localStorage is empty", () => {
      const logs = getLogs();
      expect(logs).toEqual([]);
    });

    it("returns empty array in server-side rendering context", () => {
      const originalWindow = global.window;
      // @ts-expect-error: deleting a non-optional global to simulate SSR
      delete global.window;
      const logs = getLogs();
      expect(logs).toEqual([]);
      global.window = originalWindow;
    });

    it("returns all stored logs within 24 hours", () => {
      const now = Date.now();
      const withinDay = now - 12 * 60 * 60 * 1000; // 12 hours ago

      mockStorage.setItem(
        "activity_log",
        JSON.stringify([
          {
            id: "1",
            action: "Recent",
            timestamp: withinDay,
          },
          {
            id: "2",
            action: "Now",
            timestamp: now,
          },
        ]),
      );

      const logs = getLogs();
      expect(logs).toHaveLength(2);
    });

    it("filters out logs older than 24 hours", () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const tooOld = now - oneDay - 1000; // 1 second past 24 hours

      mockStorage.setItem(
        "activity_log",
        JSON.stringify([
          {
            id: "1",
            action: "Old",
            timestamp: tooOld,
          },
          {
            id: "2",
            action: "Recent",
            timestamp: now - 1000,
          },
        ]),
      );

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("Recent");
    });

    it("updates localStorage after filtering old logs", () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      mockStorage.setItem(
        "activity_log",
        JSON.stringify([
          {
            id: "1",
            action: "Old",
            timestamp: now - oneDay - 1000,
          },
          {
            id: "2",
            action: "Recent",
            timestamp: now - 1000,
          },
        ]),
      );

      getLogs();

      const stored = JSON.parse(mockStorage.getItem("activity_log") || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].action).toBe("Recent");
    });

    it("handles corrupted JSON gracefully", () => {
      mockStorage.setItem("activity_log", "invalid json");
      expect(() => getLogs()).toThrow();
    });
  });

  describe("clearLogs", () => {
    it("removes all logs from localStorage", () => {
      addLog({ action: "Log 1" });
      addLog({ action: "Log 2" });

      clearLogs();

      const stored = mockStorage.getItem("activity_log");
      expect(stored).toBeNull();
    });

    it("allows adding new logs after clearing", () => {
      addLog({ action: "Before Clear" });
      clearLogs();
      addLog({ action: "After Clear" });

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("After Clear");
    });
  });
});
