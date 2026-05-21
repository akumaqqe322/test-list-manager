import { useState } from "react";
import { Layers, Activity, HelpCircle } from "lucide-react";
import Panel from "./components/Panel";

export default function App() {
  // A simple counter incremented whenever an list selection/addition occurs.
  // Passing this into the panels triggers an instantaneous, clean, state-synchronized data refresh.
  const [refreshCounter, setRefreshCounter] = useState(0);

  function handleActionSuccess() {
    setRefreshCounter((prev) => prev + 1);
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50/50 text-slate-900 pb-16">
      {/* Aesthetic Navigation Header */}
      <header
        id="app-navigation-header"
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-150/80 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-white rounded-xl shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1
                id="app-main-title"
                className="text-base font-bold font-sans tracking-tight text-slate-800"
              >
                Virtual List Manager
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                Queued & Batched Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-slate-500 font-medium">System Online</span>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-6 mt-10">
        {/* App Greeting Banner */}
        <div
          id="app-hero-section"
          className="mb-10 p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm relative overflow-hidden"
        >
          {/* Subtle geometric circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute -bottom-10 right-20 w-32 h-32 bg-white/5 rounded-full"></div>

          <div className="max-w-xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-3">
              <Activity className="w-3.5 h-3.5" />
              Dataset Range: 1 to 1,000,000
            </div>
            <h2 className="text-2xl font-bold font-sans tracking-tight leading-8">
              Dynamic Pagination over 1,000,000 Elements
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Experience dynamic, in-memory filtering and cursor-based infinite scroll. Manually
              added IDs are blended seamlessly.
            </p>
          </div>
        </div>

        {/* Dev Seeder Panel */}
        {process.env.NODE_ENV !== "production" && (
          <div
            id="dev-seeder-box"
            className="mb-8 p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1 px-2 bg-amber-200 text-amber-800 rounded font-mono text-[10px] uppercase font-bold">
                DEV MODE
              </span>
              <div>
                <dt className="text-xs font-bold text-amber-900 block">
                  Deterministic Seed Helper
                </dt>
                <dd className="text-[11px] text-amber-750 font-medium">
                  Seeding selected list with{" "}
                  <strong className="font-semibold text-amber-800">[10, 20, 30, 40, 50]</strong> to
                  test Drag & Drop.
                </dd>
              </div>
            </div>
            <button
              id="dev-seed-btn"
              onClick={async () => {
                try {
                  const res = await fetch("/api/items/dev/seed-selected", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: [10, 20, 30, 40, 50] }),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  handleActionSuccess();
                } catch (err: any) {
                  alert("Failed to seed selected items: " + err.message);
                }
              }}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shrink-0"
            >
              Seed [10, 20, 30, 40, 50]
            </button>
          </div>
        )}

        {/* Dual Panel Grid View */}
        <div
          id="dual-panels-container"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
        >
          {/* Left Panel: Available items (Unselected Pool) */}
          <Panel
            idPrefix="available-panel"
            title="Available Items"
            type="available"
            onActionSuccess={handleActionSuccess}
            refreshTrigger={refreshCounter}
          />

          {/* Right Panel: Selected items */}
          <Panel
            idPrefix="selected-panel"
            title="Selected Items"
            type="selected"
            onActionSuccess={handleActionSuccess}
            refreshTrigger={refreshCounter}
          />
        </div>

        {/* Informative Explanation Section */}
        <section
          id="system-architecture-docs"
          className="mt-12 p-6 bg-white rounded-2xl border border-slate-100"
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1.5">
                Technical Architecture Specifications
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                This project represents a full-stack, decoupled architecture. The virtual range
                (1..1,000,000) does not allocate physical objects on either the front-end or the
                server, relying instead on virtual iteration with constant-time set lookups.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] text-slate-500">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700 block mb-1">Pagination Mode</span>
                  Cursor-based; limits pages to 20; resets dynamically on search inputs.
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700 block mb-1">Server Registry</span>
                  In-Memory safe integers; supports custom IDs and strict order states.
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700 block mb-1">Queue Integration</span>
                  Fully active with deduplication, conflicts compaction, and sequential batch
                  flushes (10s additions, 1s reads/changes).
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
