import { test, expect } from "./fixtures";

test.describe("Upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/upload");
  });

  test("renders the file upload area", async ({ page }) => {
    // react-dropzone renders a container with role="presentation"
    // Verify the page loaded and has upload-related content
    await expect(page.locator('[role="presentation"]').first()).toBeVisible();
  });

  test("shows accepted file type information", async ({ page }) => {
    // The page describes which file types are accepted (csv, pdf, xlsx)
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text?.toLowerCase()).toMatch(/csv|pdf|xlsx/);
  });

  test("shows the upload order guide listing Venues and Courses", async ({ page }) => {
    await expect(page.getByText(/Venues/i).first()).toBeVisible();
    await expect(page.getByText(/Courses/i).first()).toBeVisible();
  });

  test("shows the idle dropzone with drag-and-drop instructions", async ({ page }) => {
    // When not uploading, the dropzone shows instructional text (no Cancel button yet)
    await expect(
      page.getByText(/Drag & drop|drag and drop|click to select/i).first(),
    ).toBeVisible();
  });

  test("uploading a CSV file triggers the upload API and shows a success message", async ({ page }) => {
    let uploadCalled = false;
    await page.route("**/api/upload", async (route) => {
      uploadCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "File imported successfully" }),
      });
    });

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "Venues.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("name,capacity\nMain Hall,200"),
    });

    await page.waitForTimeout(500);
    expect(uploadCalled).toBe(true);

    // The page shows a success message or toast after a successful upload
    const successText = page.getByText(/success|uploaded|import/i).first();
    await expect(successText).toBeVisible({ timeout: 5000 });
  });

  test("shows the Cancel Upload button while an upload is in progress", async ({ page }) => {
    // Use a slow route to keep the upload in progress long enough to check state
    await page.route("**/api/upload", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "File imported successfully" }),
      });
    });

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "Venues.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("name,capacity\nMain Hall,200"),
    });

    // Cancel button only renders while uploading/processing
    await expect(
      page.getByRole("button", { name: /Cancel Upload/i }),
    ).toBeVisible({ timeout: 3000 });
  });

  test("shows an error message when the upload API fails", async ({ page }) => {
    await page.route("**/api/upload", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      }),
    );

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "Venues.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("name,capacity\nMain Hall,200"),
    });

    // An error state should be visible
    await expect(
      page.getByText(/error|failed|something went wrong/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
