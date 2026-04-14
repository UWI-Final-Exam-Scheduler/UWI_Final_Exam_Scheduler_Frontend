import { test as setup } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Authenticate once and save browser storage state (cookies + localStorage).
 * All other specs load this state via `storageState` in playwright.config.ts,
 * so they start as an already-logged-in user without re-running the login flow.
 */
setup("authenticate", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Mock the login endpoint so tests never depend on a running backend
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Login successful" }),
    }),
  );

  // Suppress noisy API calls that fire immediately on /dashboard
  await page.route("**/api/auth/preferences", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) }),
  );
  await page.route("**/api/exams/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/venues", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/clash-matrix**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ conflicting_courses: [], courses_with_clashes: [], total_conflicts: 0, unique_courses_with_conflicts: 0, total_students_affected: 0, percentage_students_affected: 0 }) }),
  );

  await page.goto("/");
  await page.getByPlaceholder("Username").fill("admin");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  // login page uses window.location.href with an 800ms delay before redirect
  await page.waitForURL("**/dashboard", { timeout: 5000 });

  // Capture cookies + localStorage (includes the `username` key set by the login page)
  await page.context().storageState({ path: authFile });
});
