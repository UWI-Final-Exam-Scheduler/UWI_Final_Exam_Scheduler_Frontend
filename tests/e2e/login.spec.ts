import { test, expect } from "./fixtures";

// Login tests must start with no stored auth state so they reach the login form
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the login form with username and password fields", async ({ page }) => {
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("shows field validation errors when the form is submitted empty", async ({ page }) => {
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Username is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("shows only the password error when username is filled but password is empty", async ({ page }) => {
    await page.getByPlaceholder("Username").fill("admin");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page.getByText("Username is required")).not.toBeVisible();
  });

  test("shows only the username error when password is filled but username is empty", async ({ page }) => {
    await page.getByPlaceholder("Password").fill("pass123");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Username is required")).toBeVisible();
    await expect(page.getByText("Password is required")).not.toBeVisible();
  });

  test("shows the API error message when credentials are rejected", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid credentials" }),
      }),
    );

    await page.getByPlaceholder("Username").fill("wronguser");
    await page.getByPlaceholder("Password").fill("wrongpass");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });

  test("shows a network error message when the request fails", async ({ page }) => {
    await page.route("**/api/auth/login", (route) => route.abort("failed"));

    await page.getByPlaceholder("Username").fill("admin");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText(/network error/i)).toBeVisible();
  });

  test("redirects to /dashboard after a successful login", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Login successful" }),
      }),
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

    await page.getByPlaceholder("Username").fill("admin");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL("**/dashboard", { timeout: 5000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("stores the username in localStorage after a successful login", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Login successful" }),
      }),
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

    await page.getByPlaceholder("Username").fill("admin");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL("**/dashboard", { timeout: 5000 });

    const storedUsername = await page.evaluate(() =>
      localStorage.getItem("username"),
    );
    expect(storedUsername).toBe("admin");
  });
});
