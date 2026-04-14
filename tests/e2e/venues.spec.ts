import { test, expect } from "./fixtures";
import { mockVenuesAPIs, MOCK_VENUES } from "./helpers/api-mocks";

test.describe("Venues page", () => {
  test.beforeEach(async ({ page }) => {
    await mockVenuesAPIs(page);
    await page.goto("/venues");
    // Wait for venue cards to appear
    await expect(page.getByText("Main Hall")).toBeVisible();
  });

  test("displays all venue cards after loading", async ({ page }) => {
    await expect(page.getByText("Main Hall")).toBeVisible();
    await expect(page.getByText("Block C")).toBeVisible();
  });

  test("shows each venue's capacity", async ({ page }) => {
    // Cards display capacity; verify the numbers appear on the page
    await expect(page.getByText(/200/).first()).toBeVisible();
    await expect(page.getByText(/100/).first()).toBeVisible();
  });

  test("shows the venue select dropdown with a placeholder", async ({ page }) => {
    await expect(page.getByText("Select a venue...")).toBeVisible();
  });

  test("selecting a venue from the dropdown hides the placeholder", async ({ page }) => {
    // Focus the react-select input then press ArrowDown to open the menu
    await page.locator("#react-select-venue-select-input").focus();
    await page.keyboard.press("ArrowDown");
    await page.getByRole("option", { name: "Main Hall" }).click();

    // After selecting, "Select a venue..." is replaced by the chosen value
    await expect(page.getByText("Select a venue...")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Main Hall" })).toBeVisible();
  });

  test("shows an error message when venues cannot be loaded", async ({ page }) => {
    await page.route("**/api/venues", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Server error" }) }),
    );

    await page.goto("/venues");
    await expect(page.getByText(/failed to fetch venues/i)).toBeVisible();
  });
});
