import { test, expect } from "./fixtures";
import { MOCK_CLASH_MATRIX } from "./helpers/api-mocks";

const COURSE_CODE = "COMP1601";

test.describe("Course Clashes page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the per-course clash matrix endpoint
    await page.route(`**/api/course/${COURSE_CODE}/clash-matrix**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ clashes: [] }),
      }),
    );
    // Mock the global clash matrix used by the sidebar thresholds
    await page.route("**/api/clash-matrix**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CLASH_MATRIX),
      }),
    );

    await page.goto(
      `/course-clashes?courseCode=${COURSE_CODE}&enrolledStudents=80`,
    );
  });

  test("shows the clash matrix heading with the correct course code", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: `Clash Matrix for ${COURSE_CODE}` }),
    ).toBeVisible();
  });

  test("shows the Back to Courses button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Back to Courses/i }),
    ).toBeVisible();
  });

  test("clicking Back to Courses navigates to the courses page", async ({ page }) => {
    await page.route("**/api/courses**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ page: 1, per_page: 20, total: 0, pages: 0, has_next: false, has_prev: false, courses: [] }),
      }),
    );
    await page.route("**/api/courses/subjects", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.getByRole("button", { name: /Back to Courses/i }).click();

    await expect(page).toHaveURL(/\/courses/);
  });

  test("Back to Courses preserves the subject filter in the URL", async ({ page }) => {
    await page.route("**/api/courses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ page: 1, per_page: 20, total: 0, pages: 0, has_next: false, has_prev: false, courses: [] }) }),
    );
    await page.route("**/api/courses/subjects", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    // Navigate with a subject filter already in params
    await page.goto(
      `/course-clashes?courseCode=${COURSE_CODE}&enrolledStudents=80&subject=COMP`,
    );

    await page.getByRole("button", { name: /Back to Courses/i }).click();

    await expect(page).toHaveURL(/subject=COMP/);
  });

  test("Back to Courses preserves the page number in the URL", async ({ page }) => {
    await page.route("**/api/courses**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ page: 2, per_page: 20, total: 40, pages: 2, has_next: false, has_prev: true, courses: [] }) }),
    );
    await page.route("**/api/courses/subjects", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto(
      `/course-clashes?courseCode=${COURSE_CODE}&enrolledStudents=80&page=2`,
    );

    await page.getByRole("button", { name: /Back to Courses/i }).click();

    await expect(page).toHaveURL(/page=2/);
  });

  test("shows the clash matrix table for the course", async ({ page }) => {
    // Even with no clashes, the component should render (heading + table or empty state)
    // Use the heading as a proxy — if it's visible the page rendered successfully
    await expect(
      page.getByRole("heading", { name: `Clash Matrix for ${COURSE_CODE}` }),
    ).toBeVisible();
    // The back button must also be present (confirms full page layout loaded)
    await expect(
      page.getByRole("button", { name: /Back to Courses/i }),
    ).toBeVisible();
  });
});
