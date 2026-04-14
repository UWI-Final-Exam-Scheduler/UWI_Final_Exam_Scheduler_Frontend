import { test as base, expect } from "@playwright/test";

export { expect };

/**
 * Extended test fixture that silences background API calls made on every page
 * load (e.g. /api/auth/preferences) so they don't produce [WebServer] proxy
 * errors when the backend isn't running.
 */
export const test = base.extend<object>({
  page: async ({ page }, use) => {
    await page.route("**/api/auth/preferences", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      }),
    );
    await use(page);
  },
});
