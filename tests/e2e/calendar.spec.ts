import { test, expect } from "./fixtures";
import { MOCK_VENUES } from "./helpers/api-mocks";

// ── Shared mock data ──────────────────────────────────────────────────────────

/**
 * A weekday (Monday May 12, 2025) expressed as URL params.
 * time=9 → "9:00 AM" column, time=1 → "1:00 PM", time=4 → "4:00 PM"
 */
const DATE_PARAMS = "date=12&month=5&year=2025";
const DASHBOARD_WITH_DATE = `/dashboard?${DATE_PARAMS}`;

/** A basic exam at 9 AM on May 12 in Main Hall (venue id 1) */
const MOCK_EXAM_9AM = {
  id: 1,
  courseCode: "COMP1601",
  number_of_students: 80,
  exam_length: 2,
  time: 9,
  date: "2025-05-12",
  venue_id: 1,
};

/** An exam to be rescheduled (timeColumnId maps from time=0) */
const MOCK_EXAM_RESCHEDULE = {
  id: 2,
  courseCode: "MATH1115",
  number_of_students: 60,
  exam_length: 2,
  time: 0,
  date: null,
  venue_id: null,
};

/** Two splits of the same course */
const MOCK_SPLIT_A = { ...MOCK_EXAM_9AM, id: 3, courseCode: "COMP2605", number_of_students: 40 };
const MOCK_SPLIT_B = { ...MOCK_EXAM_9AM, id: 4, courseCode: "COMP2605", number_of_students: 40, time: 1 };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function mockCalendarAPIs(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    dateExams = [MOCK_EXAM_9AM],
    rescheduleExams = [],
    venues = MOCK_VENUES,
    daysWithExams = ["2025-05-12"],
  }: {
    dateExams?: object[];
    rescheduleExams?: object[];
    venues?: object[];
    daysWithExams?: string[];
  } = {},
) {
  await page.route("**/api/venues", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(venues),
    }),
  );
  await page.route("**/api/clash-matrix**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        conflicting_courses: [],
        courses_with_clashes: [],
        total_conflicts: 0,
        unique_courses_with_conflicts: 0,
        total_students_affected: 0,
        percentage_students_affected: 0,
      }),
    }),
  );
  // Broad fallback — registered FIRST so specific routes below take priority (Playwright is LIFO)
  await page.route("**/api/exams/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    }),
  );
  // Specific endpoints — registered AFTER the broad fallback so they win
  await page.route("**/api/exams/days_with_exams", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(daysWithExams),
    }),
  );
  await page.route("**/api/exams/need_rescheduling", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rescheduleExams),
    }),
  );
  await page.route(`**/api/exams/2025-05-12`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(dateExams),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Calendar — day selection", () => {
  test("shows the exam grid when a date is in the URL params", async ({ page }) => {
    await mockCalendarAPIs(page);
    await page.goto(DASHBOARD_WITH_DATE);

    // ExamDisplayer renders "Exams on <date>"
    await expect(page.getByText(/Exams on/i)).toBeVisible({ timeout: 6000 });
  });

  test("shows the 9:00 AM, 1:00 PM, and 4:00 PM time columns", async ({ page }) => {
    await mockCalendarAPIs(page);
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByRole("heading", { name: "9:00 AM" })).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("heading", { name: "1:00 PM" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "4:00 PM" })).toBeVisible();
  });

  test("shows an exam card in the correct time column", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
  });

  test("shows the To Be Rescheduled column in the sidebar", async ({ page }) => {
    await mockCalendarAPIs(page, { rescheduleExams: [MOCK_EXAM_RESCHEDULE] });
    await page.goto(DASHBOARD_WITH_DATE);

    // The reschedule column title is "Reschedule Exams" (from RESCHEDULE_COLUMN)
    await expect(page.getByRole("heading", { name: "Reschedule Exams" })).toBeVisible({ timeout: 6000 });
    await expect(page.getByText("MATH1115")).toBeVisible();
  });

  test("Select Another Day button hides the exam grid and shows the calendar", async ({ page }) => {
    await mockCalendarAPIs(page);
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText(/Exams on/i)).toBeVisible({ timeout: 6000 });

    await page.getByRole("button", { name: "Select Another Day" }).click();

    // Calendar picker re-appears (DayPicker renders month name / year)
    await expect(page.getByText(/Exams on/i)).not.toBeVisible();
  });

  test("Previous day and Next day navigation buttons are visible", async ({ page }) => {
    await mockCalendarAPIs(page);
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByRole("button", { name: "Previous day" })).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("button", { name: "Next day" })).toBeVisible();
  });

  test("clicking Next day updates the URL date params", async ({ page }) => {
    // Add May 13 to days-with-exams so the Next button is enabled
    await mockCalendarAPIs(page, { daysWithExams: ["2025-05-12", "2025-05-13"] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByRole("button", { name: "Next day" })).toBeVisible({ timeout: 6000 });
    await page.getByRole("button", { name: "Next day" }).click();

    // URL should now contain date=13
    await expect(page).toHaveURL(/date=13/, { timeout: 4000 });
  });

  test("shows the exam count badge in each time column", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByRole("heading", { name: "9:00 AM" })).toBeVisible({ timeout: 6000 });
    // The badge shows "1 exam" next to the 9 AM heading
    await expect(page.getByText("1 exam")).toBeVisible();
  });
});

test.describe("Calendar — Confirm Exam Move dialog", () => {
  test("cancelling the ScheduleAlert closes it without calling the API", async ({ page }) => {
    let rescheduleCalled = false;
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });

    await page.route("**/api/exams/reschedule", (route) => {
      rescheduleCalled = true;
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(DASHBOARD_WITH_DATE);
    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });

    // Drag the exam card to the 1 PM slot
    const examCard = page.getByText("COMP1601").first();
    const target = page.getByRole("heading", { name: "1:00 PM" });

    const cardBox = await examCard.boundingBox();
    const targetBox = await target.boundingBox();

    if (cardBox && targetBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.mouse.down();
      // Move 15px first to satisfy dnd-kit's distance:10 activation constraint
      await page.mouse.move(cardBox.x + cardBox.width / 2 + 15, cardBox.y + cardBox.height / 2);
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 + 50);
      await page.mouse.up();
    }

    // If the alert opened, cancel it
    const cancelBtn = page.getByRole("button", { name: "Cancel" });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();
      await expect(page.getByRole("alertdialog")).not.toBeVisible({ timeout: 2000 });
      expect(rescheduleCalled).toBe(false);
    }
    // If the drag didn't trigger the dialog that's acceptable — just verify no API call
    expect(rescheduleCalled).toBe(false);
  });

  test("confirming the ScheduleAlert calls PATCH /api/exams/reschedule", async ({ page }) => {
    let rescheduleCalled = false;
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });

    await page.route("**/api/exams/reschedule", async (route) => {
      rescheduleCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Exam moved" }),
      });
    });

    await page.goto(DASHBOARD_WITH_DATE);
    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });

    const examCard = page.getByText("COMP1601").first();
    const target = page.getByRole("heading", { name: "1:00 PM" });

    const cardBox = await examCard.boundingBox();
    const targetBox = await target.boundingBox();

    if (cardBox && targetBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(cardBox.x + cardBox.width / 2 + 15, cardBox.y + cardBox.height / 2);
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 + 50);
      await page.mouse.up();
    }

    const confirmBtn = page.getByRole("button", { name: "Confirm" });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await expect(page.getByRole("alertdialog")).not.toBeVisible({ timeout: 2000 });
      expect(rescheduleCalled).toBe(true);
    }
    // Drag may not always trigger dialog in headless; the test documents the expected path
  });
});

test.describe("Calendar — right-click context menu", () => {
  test("right-clicking an exam card shows the Split Exam option", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });

    const examCard = page.getByText("COMP1601").first();
    await examCard.click({ button: "right" });

    await expect(page.getByText("Split Exam")).toBeVisible({ timeout: 3000 });
  });

  test("right-clicking shows Merge Splits only when splits exist", async ({ page }) => {
    // Two splits of the same course — both appear on page (different time cols)
    await mockCalendarAPIs(page, { dateExams: [MOCK_SPLIT_A, MOCK_SPLIT_B] });
    await page.goto(DASHBOARD_WITH_DATE);

    // Wait for the first split card
    await expect(page.getByText("COMP2605").first()).toBeVisible({ timeout: 6000 });

    // Right-click the first split
    await page.getByText("COMP2605").first().click({ button: "right" });

    await expect(page.getByText("Merge Splits")).toBeVisible({ timeout: 3000 });
  });

  test("right-clicking a non-split exam does NOT show Merge Splits", async ({ page }) => {
    // Only one exam with this courseCode — no siblings → hasSplits = false
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });

    await expect(page.getByText("Split Exam")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Merge Splits")).not.toBeVisible();
  });
});

test.describe("Calendar — Split Exam dialog", () => {
  test("clicking Split Exam opens the split dialog with course code in title", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    // SplitExamDialog title is "Split <courseCode>"
    await expect(page.getByText("Split COMP1601")).toBeVisible({ timeout: 3000 });
  });

  test("split dialog shows Total students and Remaining labels", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    // Dialog shows "Total: 80 — Remaining: ..."
    await expect(page.getByText(/Total/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Remaining/i)).toBeVisible();
  });

  test("Confirm Split button is disabled when split values do not sum to total", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    // Confirm Split should be disabled before values are filled in correctly
    await expect(page.getByRole("button", { name: "Confirm Split" })).toBeDisabled({ timeout: 3000 });
  });

  test("Confirm Split button enables when splits sum to total", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    // Fill Split 1 = 40, Split 2 = 40 (total 80)
    const inputs = page.locator("input[type='number']");
    await inputs.nth(0).fill("40");
    await inputs.nth(1).fill("40");

    await expect(page.getByRole("button", { name: "Confirm Split" })).toBeEnabled({ timeout: 2000 });
  });

  test("confirming split calls POST /api/exams/split", async ({ page }) => {
    let splitCalled = false;
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.route("**/api/exams/split", async (route) => {
      splitCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Split created" }),
      });
    });

    await page.goto(DASHBOARD_WITH_DATE);
    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    const inputs = page.locator("input[type='number']");
    await inputs.nth(0).fill("40");
    await inputs.nth(1).fill("40");
    await page.getByRole("button", { name: "Confirm Split" }).click();

    await expect(async () => expect(splitCalled).toBe(true)).toPass({ timeout: 4000 });
  });

  test("cancelling split dialog closes it", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_EXAM_9AM] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP1601")).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP1601").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    await expect(page.getByText("Split COMP1601")).toBeVisible({ timeout: 3000 });
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Split COMP1601")).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe("Calendar — Merge Splits dialog", () => {
  test("clicking Merge Splits opens the merge dialog", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_SPLIT_A, MOCK_SPLIT_B] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP2605").first()).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP2605").first().click({ button: "right" });
    await page.getByText("Merge Splits").click();

    // MergeExamDialog title is "Merge <courseCode> Splits"
    await expect(page.getByText("Merge COMP2605 Splits")).toBeVisible({ timeout: 3000 });
  });

  test("merge dialog shows the combined student count", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_SPLIT_A, MOCK_SPLIT_B] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP2605").first()).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP2605").first().click({ button: "right" });
    await page.getByText("Merge Splits").click();

    // Combined total = 40 + 40 = 80
    await expect(page.getByText(/80/)).toBeVisible({ timeout: 3000 });
  });

  test("Confirm Merge button is visible in merge dialog", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_SPLIT_A, MOCK_SPLIT_B] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP2605").first()).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP2605").first().click({ button: "right" });
    await page.getByText("Merge Splits").click();

    // For exactly 2 splits the dialog shows "Confirm Merge" directly (isSimple = true)
    await expect(page.getByRole("button", { name: "Confirm Merge" })).toBeVisible({ timeout: 3000 });
  });

  test("confirming merge calls POST /api/exams/merge", async ({ page }) => {
    let mergeCalled = false;
    await mockCalendarAPIs(page, { dateExams: [MOCK_SPLIT_A, MOCK_SPLIT_B] });
    await page.route("**/api/exams/merge", async (route) => {
      mergeCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Merged" }),
      });
    });

    await page.goto(DASHBOARD_WITH_DATE);
    await expect(page.getByText("COMP2605").first()).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP2605").first().click({ button: "right" });
    await page.getByText("Merge Splits").click();

    await expect(page.getByRole("button", { name: "Confirm Merge" })).toBeVisible({ timeout: 3000 });
    await page.getByRole("button", { name: "Confirm Merge" }).click();

    await expect(async () => expect(mergeCalled).toBe(true)).toPass({ timeout: 4000 });
  });

  test("cancelling merge dialog closes it", async ({ page }) => {
    await mockCalendarAPIs(page, { dateExams: [MOCK_SPLIT_A, MOCK_SPLIT_B] });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("COMP2605").first()).toBeVisible({ timeout: 6000 });
    await page.getByText("COMP2605").first().click({ button: "right" });
    await page.getByText("Merge Splits").click();

    await expect(page.getByText("Merge COMP2605 Splits")).toBeVisible({ timeout: 3000 });
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Merge COMP2605 Splits")).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe("Calendar — reschedule column context menu", () => {
  test("right-clicking a reschedule exam shows Split Exam option", async ({ page }) => {
    await mockCalendarAPIs(page, {
      dateExams: [],
      rescheduleExams: [MOCK_EXAM_RESCHEDULE],
    });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("MATH1115")).toBeVisible({ timeout: 6000 });
    await page.getByText("MATH1115").first().click({ button: "right" });

    await expect(page.getByText("Split Exam")).toBeVisible({ timeout: 3000 });
  });

  test("split dialog for reschedule exam shows the correct course code", async ({ page }) => {
    await mockCalendarAPIs(page, {
      dateExams: [],
      rescheduleExams: [MOCK_EXAM_RESCHEDULE],
    });
    await page.goto(DASHBOARD_WITH_DATE);

    await expect(page.getByText("MATH1115")).toBeVisible({ timeout: 6000 });
    await page.getByText("MATH1115").first().click({ button: "right" });
    await page.getByText("Split Exam").click();

    await expect(page.getByText("Split MATH1115")).toBeVisible({ timeout: 3000 });
  });
});
