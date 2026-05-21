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

To run the automated E2E tests with automated dev server orchestration (via Playwright's `webServer` integration):

1. Clean assets and run the automated browser test suite inside the test runner:
   ```bash
   npx playwright test
   ```
   _(Note: Browser library installation can be initialized if needed via `npx playwright install chromium`)_

---

## Technical Assignment Compliance Checklist

Below is the verified compliance status matching every requested item of the original technical assignment prompt:

- [x] **1,000,000 Virtual Range**: Handled as a lazy math-driven numerical sequence ($1 \dots 1,000,000$). No physical items are generated or state-allocated in React.
- [x] **Separation of Selection**: Selected items are instantly removed and excluded from the Available panel view.
- [x] **Manually Added Customs**: Custom positive integers (e.g., above $1,000,000$) participate seamlessly in global text search, pagination, selection pools, and lists.
- [x] **De-duplicated Registrations**: Server-side and client-side guards prevent duplicate customs or redundant selections.
- [x] **In-Memory Shared Backend**: Express server controls and manages the core single-source-of-truth in RAM, sharing current listings across all visitors. No external database is used.
- [x] **Deterministic Pagination**: Features offset/cursor bounds limiting every network batch page request to exactly **20 elements max**. Infinite scroll triggers page requests strictly as the scroll boundary is met.
- [x] **Filtering Sync Reset**: The frontend resets pagination pages and list offsets immediately whenever search filters are typed.
- [x] **Selected Drag & Drop Sorting**: Fully implemented using `@dnd-kit`. Users can drag or keyboard-reorder elements on the selected pane.
- [x] **Stable Filtered Drag & Drop**: Dragging visible filtered selected items preserves hidden/unfiltered elements' order in the backend and frontend state stably.
- [x] **Decoupled Request Queue**: Features sequential async pipe execution.
  - **Custom additions addition-batching**: Held and batched in **10 second windows** to reduce DB write emulation spikes.
  - **Changes & reads**: Coalesced and executed in **1 second windows**.
  - **Conflicts compaction**: Dedupes and cancels matching selections/removals on the same ID in the same window, sending only the final compacted intent.

---

## Deployment on Render Free Web Service

This project is fully automated and optimized to run as a unified full-stack Node web service on Render's Free tier.

### 1. Step-by-Step Render Deployment Flow

1. **Sign in to Render** (dashboard.render.com).
2. Click **New** in the top right, then choose **Web Service**.
3. Connect your **GitHub / GitLab repository** containing this codebase.
4. Set the following configuration settings:
   - **Name**: `virtual-list-manager` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Click **Advanced**, and configure the environment variables:
   - **NODE_ENV**: `production`
6. Choose the **Free Instance Type**.
7. Click **Create Web Service**.

Your site will build, run tests, and serve at a public URL like `https://virtual-list-manager.onrender.com`.

### 2. Render Free Web Service Constraints and Limitations

- **In-Memory Transient Storage**: Because this spec requires no database, all selected list entries, sorting weights, and custom custom entries reside directly in Express state arrays in RAM. Render's Free web services can spin down, reboot, or cycle after 15 minutes of inactivity, which will clear the custom-added items and restore the empty default state.
- **Unified Global State**: There are no individual visitor accounts (this keeps the implementation matching the assignment spec). The selected state, additions, and drag sequence are shared by all visitors viewing the interface live.
- **Omitted Cross-Panel Drag & Drop**: Drag & Drop is intentionally loaded purely for reordering the **Selected Items** panel. Moving items from the Available panel to the Selected panel remains button-controlled via the high-fidelity **Select / Remove** action triggers. This avoids structural over-engineering or pointer-lock issues in narrow layouts.
