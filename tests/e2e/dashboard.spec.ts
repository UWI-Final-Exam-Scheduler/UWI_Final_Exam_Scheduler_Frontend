import { test, expect } from "./fixtures";
import { mockDashboardAPIs } from "./helpers/api-mocks";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardAPIs(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("shows the app header with the title and logo", async ({ page }) => {
    // Use getByRole to avoid strict-mode violation with the footer text
    await expect(page.getByRole("heading", { name: "Exam Scheduler" })).toBeVisible();
    await expect(page.getByAltText("UWI Logo")).toBeVisible();
  });

  test("shows all navigation links after expanding the sidebar", async ({ page }) => {
    // The sidebar starts collapsed showing only an icon toggle button (no text label).
    // Click the first button inside <aside> to expand it.
    await page.locator("aside button").first().click();

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Courses" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Venues" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Upload" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Activity Log" })).toBeVisible();
  });

  test("shows the logout button in the header", async ({ page }) => {
    // LogoutButton is rendered in the app layout header
    const logoutBtn = page.getByRole("button", { name: /logout/i });
    await expect(logoutBtn).toBeVisible();
  });

  test("logout clears localStorage and redirects to the login page", async ({ page }) => {
    await page.route("**/api/logout", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Logged out" }),
      }),
    );

    await page.getByRole("button", { name: /logout/i }).click();

    await page.waitForURL("**/", { timeout: 5000 });

    const storedUsername = await page.evaluate(() =>
      localStorage.getItem("username"),
    );
    expect(storedUsername).toBeNull();
  });

  test("renders the calendar interface inside the main content area", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    // The CalendarDayPicker is loaded dynamically; verify the container renders
    await expect(main).not.toBeEmpty();
  });

  test("navigates to Courses when the Courses sidebar link is clicked", async ({ page }) => {
    await page.route("**/api/courses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ page: 1, per_page: 20, total: 0, pages: 0, has_next: false, has_prev: false, courses: [] }) }),
    );

    // Expand the sidebar (icon-only toggle, no text label) then click Courses
    await page.locator("aside button").first().click();
    await page.getByRole("link", { name: "Courses" }).click();
    await expect(page).toHaveURL(/\/courses/);
  });
});
