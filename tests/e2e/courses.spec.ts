import { test, expect } from "./fixtures";
import { mockCoursesAPIs, MOCK_COURSES_PAGE } from "./helpers/api-mocks";

test.describe("Courses page", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoursesAPIs(page);
    await page.goto("/courses");
    // Wait for the initial course list to load
    await expect(page.getByText("COMP1601")).toBeVisible();
  });

  test("displays course cards with course codes", async ({ page }) => {
    await expect(page.getByText("COMP1601")).toBeVisible();
    await expect(page.getByText("MATH1115")).toBeVisible();
  });

  test("shows the subject filter dropdown", async ({ page }) => {
    // react-select renders a div containing the placeholder text
    await expect(page.getByText("Select a subject...")).toBeVisible();
  });

  test("shows the clash filter dropdown", async ({ page }) => {
    // CourseClashFilter select
    await expect(page.getByText("All Courses")).toBeVisible();
  });

  test("shows pagination controls", async ({ page }) => {
    await expect(page.getByRole("button", { name: "First", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeVisible();
    // Use exact: true to avoid matching the Next.js dev-tools button
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Last", exact: true })).toBeVisible();
  });

  test("pagination shows the current page number", async ({ page }) => {
    await expect(page.getByText(/Page 1/)).toBeVisible();
  });

  test("First and Previous buttons are disabled on page 1", async ({ page }) => {
    await expect(page.getByRole("button", { name: "First", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  });

  test("Next and Last buttons are disabled when there is only one page", async ({ page }) => {
    // MOCK_COURSES_PAGE has pages: 1 → no next page
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Last", exact: true })).toBeDisabled();
  });

  test("filters courses by subject when a subject is selected", async ({ page }) => {
    // useCoursesPageFilters drives the subject filter via URL params —
    // navigating with ?subject=COMP is equivalent to the user selecting COMP
    // from the dropdown (the hook initialises the filter from the URL).
    // The mock for /api/courses/subject/** returns only COMP1601.
    await page.goto("/courses?subject=COMP");

    await expect(page.getByText("COMP1601")).toBeVisible();
    await expect(page.getByText("MATH1115")).not.toBeVisible();
  });

  test("navigates to the clash matrix page when a course card is clicked", async ({ page }) => {
    // The course card click navigates to /course-clashes?courseCode=COMP1601&...
    await page.route("**/api/course/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ clashes: [] }),
      }),
    );

    await page.getByText("COMP1601").click();
    await expect(page).toHaveURL(/course-clashes.*courseCode=COMP1601/);
  });

  test("shows an error message when the clash matrix API fails", async ({ page }) => {
    // Override the clash-matrix mock to simulate a server failure
    await page.route("**/api/clash-matrix**", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );

    await page.goto("/courses");
    // The courses page shows clashError when the clash matrix endpoint fails
    await expect(
      page.getByText(/Failed to fetch clash matrix/i),
    ).toBeVisible({ timeout: 10000 });
  });
});
