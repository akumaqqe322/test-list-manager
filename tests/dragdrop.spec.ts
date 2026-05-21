import { test, expect } from "@playwright/test";

test.describe("Virtual List Manager - Drag & Drop E2E Tests", () => {
  // Let's seed the database / app state before each test
  test.beforeEach(async ({ page }) => {
    // Go to the app page first
    await page.goto("/");

    // Seed selected items using the Dev Mode helper
    const seedButton = page.locator("#dev-seed-btn");
    if (await seedButton.isVisible()) {
      await seedButton.click();
      // Wait for state refresh trigger
      await page.waitForTimeout(500);
    } else {
      // Direct API seed if UI button is not active/available (safe fallback)
      await page.request.post("/api/items/dev/seed-selected", {
        data: { ids: [10, 20, 30, 40, 50] },
      });
      await page.reload();
    }
  });

  test("Test A: Basic Selected Drag & Drop Reordering", async ({ page }) => {
    // 1. Verify selected order is originally [10, 20, 30, 40, 50]
    const selectedRows = page.locator('[data-testid^="selected-row-"]');
    await expect(selectedRows).toHaveCount(5);

    const originalIds = await selectedRows.evaluateAll((elements) =>
      elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
    );
    expect(originalIds).toEqual([10, 20, 30, 40, 50]);

    // 2. Drag ID 50 above ID 20 using drag-handle-50
    const sourceHandle = page.locator('[data-testid="drag-handle-50"]');
    const targetRow = page.locator('[data-testid="selected-row-20"]');

    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetRow.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      // Move slightly first to activate drag threshold
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2 - 10,
        { steps: 5 }
      );
      await page.waitForTimeout(100);
      // Move to target y-coordinate
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2 - 5,
        { steps: 10 }
      );
      await page.waitForTimeout(200);
      await page.mouse.up();
    }

    // Wait for optimistic state and API request to complete
    await page.waitForTimeout(1500);

    // 3. Verify UI order changes (e.g., 50 is now before 20)
    const newUIIds = await selectedRows.evaluateAll((elements) =>
      elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
    );

    const indexOf50 = newUIIds.indexOf(50);
    const indexOf20 = newUIIds.indexOf(20);
    expect(indexOf50).toBeLessThan(indexOf20);

    // 4. Reload page and check persistence
    await page.reload();
    await page.waitForTimeout(500);

    const reloadedRows = page.locator('[data-testid^="selected-row-"]');
    const reloadedIds = await reloadedRows.evaluateAll((elements) =>
      elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
    );

    expect(reloadedIds.indexOf(50)).toBeLessThan(reloadedIds.indexOf(20));
  });

  test("Test B: Filtered Selected Drag & Drop Reordering", async ({ page }) => {
    // 1. Seed custom set: [12, 22, 33, 42, 55] for test B
    await page.request.post("/api/items/dev/seed-selected", {
      data: { ids: [12, 22, 33, 42, 55] },
    });
    await page.reload();

    // Verify initial count is 5
    let selectedRows = page.locator('[data-testid^="selected-row-"]');
    await expect(selectedRows).toHaveCount(5);

    // Filter by "2" - this keeps 12, 22, and 42 visible
    const searchInput = page.locator('[data-testid="selected-search-input"]');
    await searchInput.fill("2");
    await page.waitForTimeout(500); // Wait for debounce

    // Check we only see 12, 22, 42
    selectedRows = page.locator('[data-testid^="selected-row-"]');
    await expect(selectedRows).toHaveCount(3);

    let visibleIds = await selectedRows.evaluateAll((elements) =>
      elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
    );
    expect(visibleIds).toEqual([12, 22, 42]);

    // Drag 42 above 22
    const sourceHandle = page.locator('[data-testid="drag-handle-42"]');
    const targetRow = page.locator('[data-testid="selected-row-22"]');

    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetRow.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2 - 10,
        { steps: 5 }
      );
      await page.waitForTimeout(100);
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2 - 5,
        { steps: 10 }
      );
      await page.waitForTimeout(200);
      await page.mouse.up();
    }

    await page.waitForTimeout(1500);

    // Verify UI order of visible items has 42 before 22
    visibleIds = await selectedRows.evaluateAll((elements) =>
      elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
    );
    expect(visibleIds.indexOf(42)).toBeLessThan(visibleIds.indexOf(22));

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(500);

    // Verify all 5 items are visible and hidden items (33, 55) were not lost!
    selectedRows = page.locator('[data-testid^="selected-row-"]');
    await expect(selectedRows).toHaveCount(5);

    const finalIds = await selectedRows.evaluateAll((elements) =>
      elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
    );

    // Expected order matching server mapping: [12, 42, 33, 22, 55]
    expect(finalIds).toEqual([12, 42, 33, 22, 55]);
  });
});
