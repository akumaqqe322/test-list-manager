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

## Currently Implemented Architecture (Step 1, 1.5 & Step 2)

- **Virtual List Engine**: Models a sequence from 1 to 1,000,000 using lazy-iteration algorithms and sorted arrays. Avoids physical object allocations to keep memory complexity to $O(K)$, where $K$ is the number of added or selected items.
- **Separated State Boundaries**: Keeps data structures stored in in-memory singletons inside `/server/state.ts`.
- **Isolated API Routing**: Houses Express path logic cleanly in `/server/routes/items.ts`, keeping the server boot config decoupled.
- **Dual Panel Viewport**: Real-time side-by-side available and selected item lists, each rendering 20-item pages on demand.
- **Infinite Scroll**: Utilizes `IntersectionObserver` sentinel callbacks in React to append extra listings as the user scrolls.
- **Custom Sub-item Registration**: Allows registering arbitrary safe positive integer IDs outside of the 1..1,000,000 baseline. Performs exact duplicate detection.
- **Filtered Drag & Drop Sorting**: Incorporates `@dnd-kit/core` and `@dnd-kit/sortable` on the Selected Items panel. Allows active sorting under arbitrary search input filters. The backend algorithm isolates the visible reordered subset, leaving any hidden or unloaded selected numbers in their original chronological order.
- **Drag & Drop Pagination Sync**: Optimistically recalculates and synchronizes the pagination `nextCursor` on the frontend directly after reordering. This ensures that subsequent infinite scroll requests pick up exactly from the new last loaded element in the reordered list without skipped items or duplicates.

---

## Roadmap

1. **Step 3 (Client-side request queueing)**: Implement a custom queueing module with debounce parameters to batch item selection mutations (flushing once every 10 seconds for custom additions and once every 1 second for reads/mutations).
