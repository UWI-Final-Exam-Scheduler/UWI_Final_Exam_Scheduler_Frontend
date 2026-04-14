import { test, expect } from "./fixtures";
import { mockVenuesAPIs } from "./helpers/api-mocks";

test.describe("Activity Log page", () => {
  test.beforeEach(async ({ page }) => {
    // Activity log maps venue IDs to names using the venues API
    await mockVenuesAPIs(page);
  });

  test("shows the correct table column headers", async ({ page }) => {
    await page.goto("/activityLog");
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Entity" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Old Value/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /New Value/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Timestamp" })).toBeVisible();
  });

  test("shows the empty-state message when there are no activity logs", async ({ page }) => {
    // Remove any logs that may have been seeded by the auth setup
    await page.addInitScript(() => {
      localStorage.removeItem("activity_log");
    });

    await page.goto("/activityLog");
    await expect(page.getByText("No Activity Logs Available")).toBeVisible();
  });

  test("displays log entries from localStorage", async ({ page }) => {
    const logs = [
      {
        id: "log-1",
        action: "User Login",
        entityId: "admin",
        oldValue: null,
        newValue: null,
        timestamp: Date.now(),
      },
    ];

    // Seed localStorage before the page loads
    await page.addInitScript((data) => {
      localStorage.setItem("activity_log", JSON.stringify(data));
    }, logs);

    await page.goto("/activityLog");

    await expect(page.getByText("User Login")).toBeVisible();
    await expect(page.getByText("admin")).toBeVisible();
  });

  test("displays multiple log entries in chronological order", async ({ page }) => {
    const now = Date.now();
    const logs = [
      {
        id: "log-1",
        action: "User Login",
        entityId: "admin",
        oldValue: null,
        newValue: null,
        timestamp: now - 5000,
      },
      {
        id: "log-2",
        action: "Move Exam to Reschedule",
        entityId: "COMP1601",
        oldValue: "9:00 AM",
        newValue: "To Be Rescheduled",
        timestamp: now,
      },
    ];

    await page.addInitScript((data) => {
      localStorage.setItem("activity_log", JSON.stringify(data));
    }, logs);

    await page.goto("/activityLog");

    await expect(page.getByText("User Login")).toBeVisible();
    await expect(page.getByText("Move Exam to Reschedule")).toBeVisible();
    await expect(page.getByText("COMP1601")).toBeVisible();
  });
});
