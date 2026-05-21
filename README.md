# Virtual List Manager

This project is a decoupled full-stack technical application engineered to handle, filter, and paginate a virtual collection of 1,000,000 items (IDs 1 to 1,000,000) with custom sub-item additions.

---

## Technical Stack

- **Backend**: Express.js + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Database**: None (state is strictly stored in-memory during the lifetime of the application container)

---

## Installation & Setup

### 1. Install Dependencies

Run npm install to populate the modern package structure:

```bash
npm install
```

### 2. Run the Development Server

This boots the application using TypeScript (`tsx`) on **Port 3000** with integrated Vite development middleware:

```bash
npm run dev
```

Open `http://localhost:3000` to interact with the application.

### 3. Production Build & Execution

To compile optimized React static assets and bundle the backend routing into a robust self-contained CJS bundle inside `dist/`:

```bash
npm run build
npm start
```

---

## Currently Implemented Architecture (Step 1, 2, and 3)

- **Virtual List Engine**: Models a sequence from 1 to 1,000,000 using lazy-iteration algorithms and sorted arrays. Avoids physical object allocations to keep memory complexity to $O(K)$, where $K$ is the number of added or selected items.
- **Separated State Boundaries**: Keeps data structures stored in in-memory singletons inside `/server/state.ts`.
- **Isolated API Routing**: Houses Express path logic cleanly in `/server/routes/items.ts`, keeping the server boot config decoupled.
- **Dual Panel Viewport**: Real-time side-by-side available and selected item lists, each rendering 20-item pages on demand.
- **Infinite Scroll**: Utilizes `IntersectionObserver` sentinel callbacks in React to append extra listings as the user scrolls.
- **Custom Sub-item Registration**: Allows registering arbitrary safe positive integer IDs outside of the 1..1,000,000 baseline. Performs exact duplicate detection.
- **Filtered Drag & Drop Sorting**: Incorporates `@dnd-kit/core` and `@dnd-kit/sortable` on the Selected Items panel. Allows active sorting under arbitrary search input filters. The backend algorithm isolates the visible reordered subset, leaving any hidden or unloaded selected numbers in their original chronological order.
- **Drag & Drop Pagination Sync**: Optimistically recalculates and synchronizes the pagination `nextCursor` on the frontend directly after reordering. This ensures that subsequent infinite scroll requests pick up exactly from the new last loaded element in the reordered list without skipped items or duplicates.
- **Request Queueing & Batching (Step 3 & 3.5)**:
  - **Decoupled Architecture**: Structure refactored into `directClient.ts` (raw HTTP requests), `requestQueue.ts` (caching, batching, and compaction engine), and `client.ts` (public API wrapper) to fully eliminate circular imports.
  - **Custom Addition Batching (10s window)**: Custom numeric ID creations are held and flushed once every 10 seconds.
  - **Change & Read Batching (1s window)**: Selected, unselected, and paginated read operations are batched in 1-second interval waves.
  - **Conflict Compaction**: Conflicting select/unselect intents on the same ID in the same window are compacted to preserve the latest intent.
  - **Reorder Superseding**: Only the latest reorder operation per filter search key is dispatched. Older pending requests are rejected with a clean `AbortError` handled silently by the UI without triggering rollbacks.
  - **Deterministic Pipeline Execution**: Processes mutations sequentially (select-batch, unselect-batch, and latest reorders) using an async/await pipeline inside the queue flush callback.
  - **Persistent Visual Pending State**: Retains visual item states as pending on the client-side until the network request completes, and performs robust in-flight deduplication.
  - **In-Memory Backend Invariant Assertions**: Server verifies size alignment and detects duplicates on every batch change.

---

## Drag & Drop Verification Instructions

### 1. Manual Browser Verification Flow

To manually verify the Drag & Drop functionalities:

1. **Start the application** in development mode: `npm run dev`.
2. **Access the web application** at `http://localhost:3000` (or your assigned browser sandbox URL).
3. **Seed the starting list**: Under **DEV MODE** (located in the orange-banner at the top of the main area), click the **Seed [10, 20, 30, 40, 50]** button.
4. Confirm that items `10, 20, 30, 40, 50` are successfully populated in the **Selected Items** panel.
5. **Drag to Reorder**: Hover over the drag handle (grip icon with text "Drag to reorder") on the item `#50` (the 5th selected item). Grab the handle and drag it upwards above item `#20`.
6. Confirm that the UI immediately reorders the elements on release and that no duplicate records or state corruptions are displayed.
7. **Refresh the page**: Confirm that the modified selected state and elements order are perfectly preserved by the backend in-memory registry.
8. **Filtered Drag & Drop Test**:
   - In the **Selected Items** panel search input, type `2` (this will filter the list to only display `#12`, `#22`, and `#42` if seeded with custom IDs, or search values matching `#20` and `#50` when using the default set).
   - Drag one visible filtered item card above another matching visible item card using the handle.
   - Clear the search filter.
   - Confirm that the absolute positions of all hidden selected items (e.g., `#33` or other elements not matching the `2` search key) were preserved as expected on both the frontend list and the backend memory registry.

### 2. Automated E2E Testing

To run the automated E2E tests:

1. Make sure the development server is actively running on port 3000 (`npm run dev`).
2. Run the Playwright test script:
   ```bash
   npx playwright test
   ```
   _(Note: Browser binary installation can be initialized if needed via `npx playwright install`)_
