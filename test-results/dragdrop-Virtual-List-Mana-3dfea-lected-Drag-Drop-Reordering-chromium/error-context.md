# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dragdrop.spec.ts >> Virtual List Manager - Drag & Drop E2E Tests >> Test B: Filtered Selected Drag & Drop Reordering
- Location: tests/dragdrop.spec.ts:83:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 1
Received:   2
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
        - generic [ref=e58]:
          - generic [ref=e59]:
            - generic [ref=e60]:
              - generic [ref=e61]: "#"
              - generic [ref=e62]: "1"
            - button "Select" [ref=e63]:
              - img [ref=e64]
              - text: Select
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e69]: "#"
              - generic [ref=e70]: "2"
            - button "Select" [ref=e71]:
              - img [ref=e72]
              - text: Select
          - generic [ref=e75]:
            - generic [ref=e76]:
              - generic [ref=e77]: "#"
              - generic [ref=e78]: "3"
            - button "Select" [ref=e79]:
              - img [ref=e80]
              - text: Select
          - generic [ref=e83]:
            - generic [ref=e84]:
              - generic [ref=e85]: "#"
              - generic [ref=e86]: "4"
            - button "Select" [ref=e87]:
              - img [ref=e88]
              - text: Select
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]: "#"
              - generic [ref=e94]: "5"
            - button "Select" [ref=e95]:
              - img [ref=e96]
              - text: Select
          - generic [ref=e99]:
            - generic [ref=e100]:
              - generic [ref=e101]: "#"
              - generic [ref=e102]: "6"
            - button "Select" [ref=e103]:
              - img [ref=e104]
              - text: Select
          - generic [ref=e107]:
            - generic [ref=e108]:
              - generic [ref=e109]: "#"
              - generic [ref=e110]: "7"
            - button "Select" [ref=e111]:
              - img [ref=e112]
              - text: Select
          - generic [ref=e115]:
            - generic [ref=e116]:
              - generic [ref=e117]: "#"
              - generic [ref=e118]: "8"
            - button "Select" [ref=e119]:
              - img [ref=e120]
              - text: Select
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]: "#"
              - generic [ref=e126]: "9"
            - button "Select" [ref=e127]:
              - img [ref=e128]
              - text: Select
          - generic [ref=e131]:
            - generic [ref=e132]:
              - generic [ref=e133]: "#"
              - generic [ref=e134]: "10"
            - button "Select" [ref=e135]:
              - img [ref=e136]
              - text: Select
          - generic [ref=e139]:
            - generic [ref=e140]:
              - generic [ref=e141]: "#"
              - generic [ref=e142]: "11"
            - button "Select" [ref=e143]:
              - img [ref=e144]
              - text: Select
          - generic [ref=e147]:
            - generic [ref=e148]:
              - generic [ref=e149]: "#"
              - generic [ref=e150]: "13"
            - button "Select" [ref=e151]:
              - img [ref=e152]
              - text: Select
          - generic [ref=e155]:
            - generic [ref=e156]:
              - generic [ref=e157]: "#"
              - generic [ref=e158]: "14"
            - button "Select" [ref=e159]:
              - img [ref=e160]
              - text: Select
          - generic [ref=e163]:
            - generic [ref=e164]:
              - generic [ref=e165]: "#"
              - generic [ref=e166]: "15"
            - button "Select" [ref=e167]:
              - img [ref=e168]
              - text: Select
          - generic [ref=e171]:
            - generic [ref=e172]:
              - generic [ref=e173]: "#"
              - generic [ref=e174]: "16"
            - button "Select" [ref=e175]:
              - img [ref=e176]
              - text: Select
          - generic [ref=e179]:
            - generic [ref=e180]:
              - generic [ref=e181]: "#"
              - generic [ref=e182]: "17"
            - button "Select" [ref=e183]:
              - img [ref=e184]
              - text: Select
          - generic [ref=e187]:
            - generic [ref=e188]:
              - generic [ref=e189]: "#"
              - generic [ref=e190]: "18"
            - button "Select" [ref=e191]:
              - img [ref=e192]
              - text: Select
          - generic [ref=e195]:
            - generic [ref=e196]:
              - generic [ref=e197]: "#"
              - generic [ref=e198]: "19"
            - button "Select" [ref=e199]:
              - img [ref=e200]
              - text: Select
          - generic [ref=e203]:
            - generic [ref=e204]:
              - generic [ref=e205]: "#"
              - generic [ref=e206]: "20"
            - button "Select" [ref=e207]:
              - img [ref=e208]
              - text: Select
          - generic [ref=e211]:
            - generic [ref=e212]:
              - generic [ref=e213]: "#"
              - generic [ref=e214]: "21"
            - button "Select" [ref=e215]:
              - img [ref=e216]
              - text: Select
        - generic [ref=e220]: "Loaded: 20 items"
      - generic [ref=e221]:
        - generic [ref=e222]:
          - generic [ref=e223]:
            - heading "Selected Items" [level=2] [ref=e224]
            - generic [ref=e225]: Selected Order
          - generic [ref=e226]:
            - img [ref=e227]
            - textbox "Search by ID..." [ref=e230]: "2"
        - generic [ref=e232]:
          - generic [ref=e233]:
            - generic [ref=e234]: i
            - generic [ref=e235]: Drag selected rows by the handle to reorder them.
          - generic [ref=e236]:
            - generic [ref=e237]:
              - generic [ref=e238]:
                - button "Drag item 12" [ref=e239]:
                  - img [ref=e240]
                  - generic: Drag to reorder
                - generic [ref=e247]: "#"
                - generic [ref=e248]: "12"
              - button "Unselect" [ref=e249]:
                - img [ref=e250]
                - text: Unselect
            - generic [ref=e253]:
              - generic [ref=e254]:
                - button "Drag item 22" [ref=e255]:
                  - img [ref=e256]
                  - generic: Drag to reorder
                - generic [ref=e263]: "#"
                - generic [ref=e264]: "22"
              - button "Unselect" [ref=e265]:
                - img [ref=e266]
                - text: Unselect
            - generic [ref=e269]:
              - generic [ref=e270]:
                - button "Drag item 42" [active] [ref=e271]:
                  - img [ref=e272]
                  - generic: Drag to reorder
                - generic [ref=e279]: "#"
                - generic [ref=e280]: "42"
              - button "Unselect" [ref=e281]:
                - img [ref=e282]
                - text: Unselect
          - status [ref=e285]
        - generic [ref=e287]: "Loaded: 3 items"
    - generic [ref=e289]:
      - img [ref=e291]
      - generic [ref=e294]:
        - heading "Technical Architecture Specifications" [level=3] [ref=e295]
        - paragraph [ref=e296]: This project represents a full-stack, decoupled architecture. The virtual range (1..1,000,000) does not allocate physical objects on either the front-end or the server, relying instead on virtual iteration with constant-time set lookups.
        - generic [ref=e297]:
          - generic [ref=e298]:
            - generic [ref=e299]: Pagination Mode
            - text: Cursor-based; limits pages to 20; resets dynamically on search inputs.
          - generic [ref=e300]:
            - generic [ref=e301]: Server Registry
            - text: In-Memory safe integers; supports custom IDs and strict order states.
          - generic [ref=e302]:
            - generic [ref=e303]: Queue Integration
            - text: Fully active with deduplication, conflicts compaction, and sequential batch flushes (10s additions, 1s reads/changes).
```

# Test source

```ts
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
  79  |     expect(reloadedIds.indexOf(50)).toBeLessThan(reloadedIds.indexOf(20));
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
> 126 |     expect(visibleIds.indexOf(42)).toBeLessThan(visibleIds.indexOf(22));
      |                                    ^ Error: expect(received).toBeLessThan(expected)
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