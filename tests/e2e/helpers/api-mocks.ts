import type { Page } from "@playwright/test";

// ── Shared mock data ──────────────────────────────────────────────────────────

export const MOCK_VENUES = [
  { id: 1, name: "Main Hall", capacity: 200 },
  { id: 2, name: "Block C", capacity: 100 },
];

export const MOCK_COURSES_PAGE = {
  page: 1,
  per_page: 20,
  total: 2,
  pages: 1,
  has_next: false,
  has_prev: false,
  courses: [
    { courseCode: "COMP1601", name: "Intro to Computer Science", enrolledStudents: 80 },
    { courseCode: "MATH1115", name: "Calculus I", enrolledStudents: 120 },
  ],
};

export const MOCK_CLASH_MATRIX = {
  conflicting_courses: [],
  courses_with_clashes: [],
  total_conflicts: 0,
  unique_courses_with_conflicts: 0,
  total_students_affected: 0,
  percentage_students_affected: 0,
};

// ── Per-page mock helpers ─────────────────────────────────────────────────────

/** Mock all API calls made by the Dashboard page */
export async function mockDashboardAPIs(page: Page) {
  await page.route("**/api/exams/days_with_exams", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["2025-05-12"]),
    }),
  );
  await page.route("**/api/exams/need_rescheduling", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/exams/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/venues", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VENUES),
    }),
  );
  await page.route("**/api/clash-matrix**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CLASH_MATRIX),
    }),
  );
}

/** Mock all API calls made by the Courses page */
export async function mockCoursesAPIs(page: Page) {
  // Playwright matches the MOST RECENTLY registered route first.
  // Register broad patterns first (lowest priority) and specific patterns last (highest priority).

  // Fallback for any /api/courses?... request (lowest priority)
  await page.route("**/api/courses**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_COURSES_PAGE),
    }),
  );
  await page.route("**/api/clash-matrix**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CLASH_MATRIX),
    }),
  );
  // Specific endpoints registered after → higher priority than the broad fallback
  await page.route("**/api/courses/subjects", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["COMP", "MATH"]),
    }),
  );
  await page.route("**/api/courses/subject/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_COURSES_PAGE,
        courses: [MOCK_COURSES_PAGE.courses[0]],
        total: 1,
      }),
    }),
  );
}

/** Mock all API calls made by the Venues page */
export async function mockVenuesAPIs(page: Page) {
  await page.route("**/api/venues/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VENUES[0]),
    }),
  );
  await page.route("**/api/venues", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VENUES),
    }),
  );
}
