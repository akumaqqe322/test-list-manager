import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, RotateCw, Loader2, ArrowRightLeft } from "lucide-react";
import { Item, PaginatedResponse } from "../types";
import { apiClient } from "../api/client";
import {
  subscribeToQueue,
  getPendingAddIds,
  getPendingSelectIds,
  getPendingUnselectIds,
  getKnownSelectedIds,
} from "../api/requestQueue";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItemRow } from "./SortableItemRow";

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

  // Queue state tracking
  const [pendingAddIds, setPendingAddIds] = useState<Set<number>>(new Set());
  const [pendingSelectIds, setPendingSelectIds] = useState<Set<number>>(new Set());
  const [pendingUnselectIds, setPendingUnselectIds] = useState<Set<number>>(new Set());
  const [knownSelectedIds, setKnownSelectedIds] = useState<Set<number>>(new Set());
  const [clickedIds, setClickedIds] = useState<Set<number>>(new Set());
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  const generationRef = useRef(0);

  useEffect(() => {
    function updateQueueState() {
      setPendingAddIds(new Set(getPendingAddIds()));
      setPendingSelectIds(new Set(getPendingSelectIds()));
      setPendingUnselectIds(new Set(getPendingUnselectIds()));
      setKnownSelectedIds(new Set(getKnownSelectedIds()));
    }
    updateQueueState();
    return subscribeToQueue(updateQueueState);
  }, []);

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
    generationRef.current += 1;
    const currentGen = generationRef.current;

    async function initialFetch() {
      setLoading(true);
      setError(null);
      try {
        let res: PaginatedResponse;

        // Task 3: Normal search reads go through queue; mutation reconciliation (indicated by refreshTrigger > 0)
        // may bypass queued reads to prevent stale UI duplication.
        const isReconciliation = refreshTrigger > 0;

        if (type === "available") {
          if (isReconciliation) {
            res = await apiClient.fetchAvailableImmediate(debouncedSearch, null);
          } else {
            res = await apiClient.fetchAvailable(debouncedSearch, null);
          }
        } else {
          if (isReconciliation) {
            res = await apiClient.fetchSelectedImmediate(debouncedSearch, null);
          } else {
            res = await apiClient.fetchSelected(debouncedSearch, null);
          }
        }

        if (active && currentGen === generationRef.current) {
          setItems(res.items);
          setNextCursor(res.nextCursor);
          setHasMore(res.hasMore);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Ignore cancelled read queues gracefully
          return;
        }
        if (active && currentGen === generationRef.current) {
          setError(err.message || "Failed to load items");
        }
      } finally {
        if (active && currentGen === generationRef.current) {
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
    generationRef.current += 1;
    const currentGen = generationRef.current;

    try {
      let res: PaginatedResponse;
      if (type === "available") {
        res = await apiClient.fetchAvailable(debouncedSearch, nextCursor);
      } else {
        res = await apiClient.fetchSelected(debouncedSearch, nextCursor);
      }

      if (currentGen === generationRef.current) {
        setItems((prev) => {
          // Prevent duplicate IDs from entering state during high concurrency
          const existingIds = new Set(prev.map((item) => item.id));
          const filteredNew = res.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      if (currentGen === generationRef.current) {
        setError(err.message || "Failed to load next page");
      }
    } finally {
      if (currentGen === generationRef.current) {
        setLoadingMore(false);
      }
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

  // Action: Select or Unselect specific item with optimistic UI removal & rollback
  async function handleToggleAction(id: number) {
    if (clickedIds.has(id)) return;
    setClickedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActionLoadingId(id);
    setError(null);

    const oldItems = [...items];
    const oldNextCursor = nextCursor;
    const oldHasMore = hasMore;

    // Immediately remove X from local items state optimistically
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      if (type === "available") {
        await apiClient.selectItem(id);
      } else {
        await apiClient.unselectItem(id);
      }
      onActionSuccess();
    } catch (err: any) {
      // rollback if selection / unselection fails
      setItems(oldItems);
      setNextCursor(oldNextCursor);
      setHasMore(oldHasMore);
      setError(err.message || `Action failed for ID ${id}`);
    } finally {
      setActionLoadingId(null);
      setClickedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

    const targetId = numericId;
    setCustomIdText("");
    setAddSuccess(`ID ${targetId} queued for addition (batched every 10s)`);

    apiClient
      .addCustomId(targetId)
      .then(() => {
        setAddSuccess(`ID ${targetId} successfully added to pool!`);
        onActionSuccess();
        setTimeout(() => {
          setAddSuccess(null);
        }, 3000);
      })
      .catch((err: any) => {
        setAddError(err.message || `Failed to add ID ${targetId}`);
      });
  }

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: { active: { id: any } }) {
    const id = Number(event.active.id);
    setActiveDragId(id);
    if (process.env.NODE_ENV !== "production") {
      console.debug("Started dragging item ID:", id);
    }
  }

  function handleDragCancel() {
    setActiveDragId(null);
    if (process.env.NODE_ENV !== "production") {
      console.debug("Dragging operation canceled");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldItems = [...items];
    const oldNextCursor = nextCursor;

    const oldIdx = oldItems.findIndex((i) => i.id === active.id);
    const newIdx = oldItems.findIndex((i) => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    // Optimistically update list order locally
    const reorderedItems = arrayMove(oldItems, oldIdx, newIdx);
    setItems(reorderedItems);

    // Update nextCursor optimistically based on the reordered local list
    if (hasMore && reorderedItems.length > 0) {
      const lastItem = reorderedItems[reorderedItems.length - 1];
      setNextCursor(lastItem.id);
    } else {
      setNextCursor(null);
    }

    try {
      const orderedVisibleIds = reorderedItems.map((item) => item.id);
      await apiClient.reorderSelectedItems(orderedVisibleIds, debouncedSearch);
      // Note: we don't trigger a full parent reset to avoid pagination reset, preserving
      // any unloaded item orders cleanly on the server & client side.
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Ignored: request was superseded by a newer reorder.
        return;
      }
      setItems(oldItems);
      setNextCursor(oldNextCursor);
      setError(err.message || "Failed to save order");
    }
  }

  // Client-side safety filter:
  // Available list must never render IDs that are selected, pending selection, or known selected.
  // Selected list must never render IDs that are pending unselection.
  const visibleItems = items.filter((item) => {
    if (type === "available") {
      return !pendingSelectIds.has(item.id) && !knownSelectedIds.has(item.id);
    } else {
      return !pendingUnselectIds.has(item.id);
    }
  });

  return (
    <div
      id={`${idPrefix}-container`}
      data-testid={`${type}-panel`}
      className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Panel Header */}
      <div id={`${idPrefix}-header`} className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-1">
          <h2
            id={`${idPrefix}-title`}
            className="text-lg font-semibold font-sans text-slate-800 tracking-tight"
          >
            {title}
          </h2>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
            {type === "available" ? "Unselected Pool" : "Selected Order"}
          </span>
        </div>
        <p className="text-slate-400 text-xs mb-3 font-normal">
          {type === "available"
            ? "Use Select to move items into the selected list."
            : "Drag selected rows by the handle to reorder them."}
        </p>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id={`${idPrefix}-search-input`}
            data-testid={`${type}-search-input`}
            type="text"
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
          />
        </div>

        {/* Global batch queue indicator */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <RotateCw className="w-3 h-3 text-slate-350 shrink-0" />
          <span>Selection changes are buffered and saved in 1-second batches.</span>
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
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
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
            <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">
              * Operations are queued and dispatched in 10-second intervals to minimize server load.
            </p>
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
          <div
            id={`${idPrefix}-error-alert`}
            className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600"
          >
            {error}
          </div>
        )}

        {/* Content Render */}
        {loading && visibleItems.length === 0 && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-xs">Preparing dataset...</span>
          </div>
        ) : visibleItems.length === 0 && pendingAddIds.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
            <p className="text-sm font-medium">No items found</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? "Try adjusting your search criteria" : "This list pool is currently empty"}
            </p>
          </div>
        ) : (
          <>
            {type === "available" ? (
              <div className="space-y-4">
                {/* Visual Queue/Pending Additions */}
                {pendingAddIds.size > 0 && (
                  <div className="space-y-1.5 p-3.5 bg-amber-50/35 border border-amber-200/50 rounded-xl">
                    <p className="text-[10px] font-semibold tracking-wider uppercase text-amber-700 font-sans flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Queued Additions ({pendingAddIds.size})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {Array.from(pendingAddIds).map((id) => (
                        <div
                          key={`pending-add-${id}`}
                          className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-amber-200/40 rounded-lg shadow-sm animate-pulse"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-300">#</span>
                            <span className="text-xs font-mono font-medium text-amber-800">
                              {id.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-550" />
                            <span>Queued (10s max)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {visibleItems.length > 0 && (
                  <div className="divide-y divide-slate-100 border border-slate-50 rounded-xl overflow-hidden bg-slate-50/20">
                    {visibleItems.map((item) => {
                      const isPendingSelect = pendingSelectIds.has(item.id);
                      const isLoading =
                        actionLoadingId === item.id || isPendingSelect || clickedIds.has(item.id);
                      return (
                        <div
                          id={`${idPrefix}-item-row-${item.id}`}
                          data-testid={`available-row-${item.id}`}
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
                            data-testid={`select-button-${item.id}`}
                            onClick={() => handleToggleAction(item.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRightLeft className="w-3 h-3" />
                            )}
                            {isPendingSelect ? "Queued" : "Select"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleItems.length > 0 && (
                  <div
                    id={`${idPrefix}-drag-hint`}
                    className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 font-bold text-[10px] shrink-0">
                      i
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Drag selected rows by the handle to reorder them.
                    </span>
                  </div>
                )}

                {activeDragId !== null && (
                  <div
                    id={`${idPrefix}-drag-active-indicator`}
                    className="text-center py-1.5 bg-slate-50 border border-slate-200 rounded-lg animate-pulse"
                  >
                    <p className="text-[10px] font-mono font-medium text-slate-600">
                      Dragging Item #{activeDragId}
                    </p>
                  </div>
                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragCancel={handleDragCancel}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={visibleItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1 rounded-xl overflow-hidden bg-slate-50/30 p-1">
                      {visibleItems.map((item) => (
                        <SortableItemRow
                          key={item.id}
                          item={item}
                          idPrefix={idPrefix}
                          onAction={handleToggleAction}
                          actionLoadingId={actionLoadingId}
                          isPending={pendingUnselectIds.has(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

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
        Loaded: {visibleItems.length} items
      </div>
    </div>
  );
}
