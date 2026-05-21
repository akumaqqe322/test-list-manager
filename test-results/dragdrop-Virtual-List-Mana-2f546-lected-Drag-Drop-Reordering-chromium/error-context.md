# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dragdrop.spec.ts >> Virtual List Manager - Drag & Drop E2E Tests >> Test A: Basic Selected Drag & Drop Reordering
- Location: tests/dragdrop.spec.ts:24:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < -1
Received:   -1
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e12]:
          - heading "Virtual List Manager" [level=1] [ref=e13]
          - paragraph [ref=e14]: Queued & Batched Engine
      - generic [ref=e19]: System Online
  - main [ref=e20]:
    - generic [ref=e24]:
      - generic [ref=e25]:
        - img [ref=e26]
        - text: "Dataset Range: 1 to 1,000,000"
      - heading "Dynamic Pagination over 1,000,000 Elements" [level=2] [ref=e28]
      - paragraph [ref=e29]: Experience dynamic, in-memory filtering and cursor-based infinite scroll. Manually added IDs are blended seamlessly.
    - generic [ref=e30]:
      - generic [ref=e31]:
        - generic [ref=e32]: DEV MODE
        - generic [ref=e33]:
          - term [ref=e34]: Deterministic Seed Helper
          - definition [ref=e35]:
            - text: Seeding selected list with
            - strong [ref=e36]: "[10, 20, 30, 40, 50]"
            - text: to test Drag & Drop.
      - button "Seed [10, 20, 30, 40, 50]" [ref=e37] [cursor=pointer]
    - generic [ref=e38]:
      - generic [ref=e39]:
        - generic [ref=e40]:
          - generic [ref=e41]:
            - heading "Available Items" [level=2] [ref=e42]
            - generic [ref=e43]: Unselected Pool
          - generic [ref=e44]:
            - img [ref=e45]
            - textbox "Search by ID..." [ref=e48]
          - generic [ref=e49]:
            - generic [ref=e50]: Add Custom Number ID
            - generic [ref=e51]:
              - spinbutton "Add Custom Number ID" [ref=e52]
              - button "Add" [ref=e53]:
                - img [ref=e54]
                - text: Add
            - paragraph [ref=e55]: "* Operations are queued and dispatched in 10-second intervals to minimize server load."
        - generic [ref=e57]:
          - img [ref=e58]
          - generic [ref=e60]: Preparing dataset...
        - generic [ref=e61]: "Loaded: 0 items"
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e64]:
            - heading "Selected Items" [level=2] [ref=e65]
            - generic [ref=e66]: Selected Order
          - generic [ref=e67]:
            - img [ref=e68]
            - textbox "Search by ID..." [ref=e71]
        - generic [ref=e73]:
          - img [ref=e74]
          - generic [ref=e76]: Preparing dataset...
        - generic [ref=e77]: "Loaded: 0 items"
    - generic [ref=e79]:
      - img [ref=e81]
      - generic [ref=e84]:
        - heading "Technical Architecture Specifications" [level=3] [ref=e85]
        - paragraph [ref=e86]: This project represents a full-stack, decoupled architecture. The virtual range (1..1,000,000) does not allocate physical objects on either the front-end or the server, relying instead on virtual iteration with constant-time set lookups.
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]: Pagination Mode
            - text: Cursor-based; limits pages to 20; resets dynamically on search inputs.
          - generic [ref=e90]:
            - generic [ref=e91]: Server Registry
            - text: In-Memory safe integers; supports custom IDs and strict order states.
          - generic [ref=e92]:
            - generic [ref=e93]: Queue Integration
            - text: Fully active with deduplication, conflicts compaction, and sequential batch flushes (10s additions, 1s reads/changes).
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Virtual List Manager - Drag & Drop E2E Tests", () => {
  4   |   // Let's seed the database / app state before each test
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Go to the app page first
  7   |     await page.goto("/");
  8   | 
  9   |     // Seed selected items using the Dev Mode helper
  10  |     const seedButton = page.locator("#dev-seed-btn");
  11  |     if (await seedButton.isVisible()) {
  12  |       await seedButton.click();
  13  |       // Wait for state refresh trigger
  14  |       await page.waitForTimeout(500);
  15  |     } else {
  16  |       // Direct API seed if UI button is not active/available (safe fallback)
  17  |       await page.request.post("/api/items/dev/seed-selected", {
  18  |         data: { ids: [10, 20, 30, 40, 50] },
  19  |       });
  20  |       await page.reload();
  21  |     }
  22  |   });
  23  | 
  24  |   test("Test A: Basic Selected Drag & Drop Reordering", async ({ page }) => {
  25  |     // 1. Verify selected order is originally [10, 20, 30, 40, 50]
  26  |     const selectedRows = page.locator('[data-testid^="selected-row-"]');
  27  |     await expect(selectedRows).toHaveCount(5);
  28  | 
  29  |     const originalIds = await selectedRows.evaluateAll((elements) =>
  30  |       elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
  31  |     );
  32  |     expect(originalIds).toEqual([10, 20, 30, 40, 50]);
  33  | 
  34  |     // 2. Focus on drag-handle-50 and use Keyboard Sensors:
  35  |     const sourceHandle = page.locator('[data-testid="drag-handle-50"]');
  36  |     const targetRow = page.locator('[data-testid="selected-row-20"]');
  37  |     const sourceBox = await sourceHandle.boundingBox();
  38  |     const targetBox = await targetRow.boundingBox();
  39  |     console.log("Source Handle Box:", sourceBox);
  40  |     console.log("Target Row Box:", targetBox);
  41  | 
  42  |     await sourceHandle.focus();
  43  |     await page.keyboard.press("Space");
  44  |     await page.waitForTimeout(200);
  45  | 
  46  |     // Press ArrowUp 3 times to move item 50 above item 20
  47  |     await page.keyboard.press("ArrowUp");
  48  |     await page.waitForTimeout(100);
  49  |     await page.keyboard.press("ArrowUp");
  50  |     await page.waitForTimeout(100);
  51  |     await page.keyboard.press("ArrowUp");
  52  |     await page.waitForTimeout(100);
  53  | 
  54  |     // Complete drop
  55  |     await page.keyboard.press("Space");
  56  | 
  57  |     // Wait for optimistic state and API request queue execution to complete (1 second wait + buffer)
  58  |     await page.waitForTimeout(1500);
  59  | 
  60  |     // 3. Verify UI order changes (50 is now before 20)
  61  |     const newUIIds = await selectedRows.evaluateAll((elements) =>
  62  |       elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
  63  |     );
  64  | 
  65  |     const indexOf50 = newUIIds.indexOf(50);
  66  |     const indexOf20 = newUIIds.indexOf(20);
  67  |     expect(indexOf50).toBeLessThan(indexOf20);
  68  |     expect(newUIIds).toEqual([10, 50, 20, 30, 40]);
  69  | 
  70  |     // 4. Reload page and check persistence
  71  |     await page.reload();
  72  |     await page.waitForTimeout(500);
  73  | 
  74  |     const reloadedRows = page.locator('[data-testid^="selected-row-"]');
  75  |     const reloadedIds = await reloadedRows.evaluateAll((elements) =>
  76  |       elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
  77  |     );
  78  | 
> 79  |     expect(reloadedIds.indexOf(50)).toBeLessThan(reloadedIds.indexOf(20));
      |                                     ^ Error: expect(received).toBeLessThan(expected)
  80  |     expect(reloadedIds).toEqual([10, 50, 20, 30, 40]);
  81  |   });
  82  | 
  83  |   test("Test B: Filtered Selected Drag & Drop Reordering", async ({ page }) => {
  84  |     // 1. Seed custom set: [12, 22, 33, 42, 55] for test B
  85  |     await page.request.post("/api/items/dev/seed-selected", {
  86  |       data: { ids: [12, 22, 33, 42, 55] },
  87  |     });
  88  |     await page.reload();
  89  | 
  90  |     // Verify initial count is 5
  91  |     let selectedRows = page.locator('[data-testid^="selected-row-"]');
  92  |     await expect(selectedRows).toHaveCount(5);
  93  | 
  94  |     // Filter by "2" - this keeps 12, 22, and 42 visible
  95  |     const searchInput = page.locator('[data-testid="selected-search-input"]');
  96  |     await searchInput.fill("2");
  97  |     await page.waitForTimeout(500); // Wait for debounce
  98  | 
  99  |     // Check we only see 12, 22, 42
  100 |     selectedRows = page.locator('[data-testid^="selected-row-"]');
  101 |     await expect(selectedRows).toHaveCount(3);
  102 | 
  103 |     let visibleIds = await selectedRows.evaluateAll((elements) =>
  104 |       elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
  105 |     );
  106 |     expect(visibleIds).toEqual([12, 22, 42]);
  107 | 
  108 |     // Focus drag-handle-42, press Space, press ArrowUp 1 time to move 42 above 22, press Space to drop
  109 |     const sourceHandle = page.locator('[data-testid="drag-handle-42"]');
  110 |     await sourceHandle.focus();
  111 |     await page.keyboard.press("Space");
  112 |     await page.waitForTimeout(200);
  113 | 
  114 |     await page.keyboard.press("ArrowUp");
  115 |     await page.waitForTimeout(100);
  116 | 
  117 |     await page.keyboard.press("Space");
  118 | 
  119 |     // Wait for queue flush to complete
  120 |     await page.waitForTimeout(1500);
  121 | 
  122 |     // Verify UI order of visible items has 42 before 22
  123 |     visibleIds = await selectedRows.evaluateAll((elements) =>
  124 |       elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
  125 |     );
  126 |     expect(visibleIds.indexOf(42)).toBeLessThan(visibleIds.indexOf(22));
  127 |     expect(visibleIds).toEqual([12, 42, 22]);
  128 | 
  129 |     // Clear search
  130 |     await searchInput.fill("");
  131 |     await page.waitForTimeout(500);
  132 | 
  133 |     // Verify all 5 items are visible and hidden items (33, 55) were not lost!
  134 |     selectedRows = page.locator('[data-testid^="selected-row-"]');
  135 |     await expect(selectedRows).toHaveCount(5);
  136 | 
  137 |     const finalIds = await selectedRows.evaluateAll((elements) =>
  138 |       elements.map((el) => Number(el.getAttribute("data-testid")?.replace("selected-row-", "")))
  139 |     );
  140 | 
  141 |     // Expected order matching server mapping: [12, 42, 33, 22, 55]
  142 |     expect(finalIds).toEqual([12, 42, 33, 22, 55]);
  143 |   });
  144 | });
  145 | 
```