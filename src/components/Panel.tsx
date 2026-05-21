import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, RotateCw, Loader2, ArrowRightLeft } from "lucide-react";
import { Item, PaginatedResponse } from "../types";
import { apiClient } from "../api/client";

interface PanelProps {
  idPrefix: string;
  title: string;
  type: "available" | "selected";
  onActionSuccess: () => void;
  refreshTrigger: number;
}

export default function Panel({
  idPrefix,
  title,
  type,
  onActionSuccess,
  refreshTrigger,
}: PanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom ID addition state (available panel only)
  const [customIdText, setCustomIdText] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Refs for infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Handle Debouncing search string to prevent hammering APIs
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Main list fetch effect: triggers when search filter changes or outer refresh trigger increments
  useEffect(() => {
    let active = true;

    async function initialFetch() {
      setLoading(true);
      setError(null);
      try {
        let res: PaginatedResponse;
        if (type === "available") {
          res = await apiClient.fetchAvailable(debouncedSearch, null);
        } else {
          res = await apiClient.fetchSelected(debouncedSearch, null);
        }

        if (active) {
          setItems(res.items);
          setNextCursor(res.nextCursor);
          setHasMore(res.hasMore);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load items");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      active = false;
    };
  }, [debouncedSearch, type, refreshTrigger]);

  // Handle loading subsequent pages (infinite scroll)
  async function loadNextPage() {
    if (loadingMore || !hasMore || nextCursor === null) return;

    setLoadingMore(true);
    setError(null);
    try {
      let res: PaginatedResponse;
      if (type === "available") {
        res = await apiClient.fetchAvailable(debouncedSearch, nextCursor);
      } else {
        res = await apiClient.fetchSelected(debouncedSearch, nextCursor);
      }

      setItems((prev) => {
        // Prevent duplicate IDs from entering state during high concurrency
        const existingIds = new Set(prev.map((item) => item.id));
        const filteredNew = res.items.filter((item) => !existingIds.has(item.id));
        return [...prev, ...filteredNew];
      });
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err: any) {
      setError(err.message || "Failed to load next page");
    } finally {
      setLoadingMore(false);
    }
  }

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel && observerRef.current) {
      observerRef.current.observe(currentSentinel);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, nextCursor, loading, loadingMore, debouncedSearch]);

  // Action: Select or Unselect specific item
  async function handleToggleAction(id: number) {
    setActionLoadingId(id);
    setError(null);
    try {
      if (type === "available") {
        await apiClient.selectItem(id);
      } else {
        await apiClient.unselectItem(id);
      }
      onActionSuccess();
    } catch (err: any) {
      setError(err.message || `Action failed for ID ${id}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Action: Add custom ID (available panel only)
  async function handleAddCustomId(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    const numericId = parseInt(customIdText.trim(), 10);
    if (isNaN(numericId) || numericId <= 0 || !Number.isSafeInteger(numericId)) {
      setAddError("Please enter a valid positive safe integer");
      return;
    }

    setAddLoading(true);
    try {
      await apiClient.addCustomId(numericId);
      setAddSuccess(`Custom ID ${numericId} added successfully!`);
      setCustomIdText("");
      onActionSuccess();

      // Clear success notification after 3 seconds
      setTimeout(() => {
        setAddSuccess(null);
      }, 3000);
    } catch (err: any) {
      setAddError(err.message || "Failed to add ID");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div
      id={`${idPrefix}-container`}
      className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Panel Header */}
      <div id={`${idPrefix}-header`} className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <h2 id={`${idPrefix}-title`} className="text-lg font-semibold font-sans text-slate-800 tracking-tight">
            {title}
          </h2>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
            {type === "available" ? "Unselected Pool" : "Selected Order"}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id={`${idPrefix}-search-input`}
            type="text"
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
          />
        </div>

        {/* Custom Add Form (Left panel only) */}
        {type === "available" && (
          <form
            id={`${idPrefix}-add-form`}
            onSubmit={handleAddCustomId}
            className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-slate-200/50"
          >
            <label htmlFor="custom-id-input" className="text-xs font-medium text-slate-500">
              Add Custom Number ID
            </label>
            <div className="flex gap-2">
              <input
                id="custom-id-input"
                type="number"
                min="1"
                step="1"
                placeholder="Limitless positive integer..."
                value={customIdText}
                onChange={(e) => setCustomIdText(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
              />
              <button
                id="custom-id-add-button"
                type="submit"
                disabled={addLoading}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition disabled:opacity-50"
              >
                {addLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Add
              </button>
            </div>
            {addError && (
              <p id="custom-add-error" className="text-xs text-red-500 mt-1">
                {addError}
              </p>
            )}
            {addSuccess && (
              <p id="custom-add-success" className="text-xs text-emerald-600 mt-1">
                {addSuccess}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Item List Scroll Area */}
      <div
        id={`${idPrefix}-items-viewport`}
        className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[350px] max-h-[550px]"
      >
        {/* API Error Notification */}
        {error && (
          <div id={`${idPrefix}-error-alert`} className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Content Render */}
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-xs">Preparing dataset...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
            <p className="text-sm font-medium">No items found</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? "Try adjusting your search criteria" : "This list pool is currently empty"}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 border border-slate-50 rounded-xl overflow-hidden bg-slate-50/20">
              {items.map((item) => (
                <div
                  id={`${idPrefix}-item-row-${item.id}`}
                  key={item.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-300">#</span>
                    <span className="text-sm font-mono font-medium text-slate-800">
                      {item.id.toLocaleString()}
                    </span>
                  </div>

                  <button
                    id={`${idPrefix}-item-action-${item.id}`}
                    onClick={() => handleToggleAction(item.id)}
                    disabled={actionLoadingId === item.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      type === "available"
                        ? "bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700"
                        : "bg-red-50 hover:bg-red-500 hover:text-white text-red-600"
                    }`}
                  >
                    {actionLoadingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="w-3 h-3" />
                    )}
                    {type === "available" ? "Select" : "Unselect"}
                  </button>
                </div>
              ))}
            </div>

            {/* Sentinel element to trigger background infinite scroll load */}
            <div
              ref={sentinelRef}
              id={`${idPrefix}-sentinel`}
              className="py-4 flex justify-center text-slate-400 min-h-[30px]"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Loading batch...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer statistics bar */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-right text-[11px] font-mono text-slate-400">
        Loaded: {items.length} items
      </div>
    </div>
  );
}
