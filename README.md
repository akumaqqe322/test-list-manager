# Virtual List Manager

A high-performance dual-panel application designed to manage, filter, and paginate a virtual collection of 1,000,000 items (IDs 1 to 1,000,000) with dynamic sub-item registration.

---

## 🛠 Project Stack

The system is engineered as a modern, full-stack, decoupled single-origin application:

* **Backend**: Express.js + TypeScript (running directly via `tsx` dev compilation)
* **Frontend**: React + Vite + TypeScript
* **Styling**: Tailwind CSS (loaded strictly through Vite configuration via `@tailwindcss/vite`)
* **Database**: None (state is managed 100% in-memory on the active Node process, bypassing database latencies for maximum technical assessment focus)

---

## 🚀 Installation & Operation

### 1. Install Dependencies
Run the package installation tool to fetch all packages declared in the `package.json` manifest:
```bash
npm install
```

### 2. Run the Application in Development Mode
To boot the full-stack system on **Port 3000** (enabling hot rebuilding, real-time TypeScript checking, and Express API routing backed by Vite's development middleware), execute:
```bash
npm run dev
```
Then visit: `http://localhost:3000`

### 3. Build & Run in Production Mode
To compile the absolute client distribution files and bundle the backend Express server into a single standalone executable CJS script (minimizing container deployment footprint), execute:
```bash
npm run build
npm start
```

---

## 🔍 What is Implemented in Step 1

* ✅ **Virtual Range Modeling**: Underpins virtual items from ID 1 to 1,000,000 without allocating physical memory blocks.
* ✅ **Dual Panel UI**: Split-column responsive cards for **Available Items** and **Selected Items** respectively.
* ✅ **High-Grade Search & Filtering**: Substring ID matching on both columns, featuring smart search skips for non-numeric queries.
* ✅ **Deterministic Cursor-Based Pagination**: Dynamic infinite scrolling (20 item pages) using the ID of the last item in viewport as pagination anchor.
* ✅ **Custom ID Integration**: Instant validation and manual addition of customized ID values, merged natively with the virtual series.
* ✅ **Action Coordinator**: Atomic React state coordination triggering dual-panel refreshing upon element modification.
* ✅ **Design Identity**: A clean, modern light layout pairing high-contrast Slate hues with Inter & JetBrains Mono typography.

---

## ⏭ Intentionally Left for Next Steps (Roadmap)

To maintain a secure and focused architectural foundation, the following features are scheduled for subsequent stages:

1. **Drag & Drop Reordering**: Integrating `@dnd-kit/core` and `@dnd-kit/sortable` to sort Selected Items dynamically, even when filtered.
2. **Request Queue & Batching**: Adding a dedicated frontend queue layer to batch element selections (flushing and deduplicating once every 10 seconds for addition and every 1 second for reads/mutations).
3. **Persistent Server Hosting**: Preparing deployment protocols for production-ready, long-running Node container services (e.g., Railway/Render/Fly.io) to support state-preservative in-memory structures.
