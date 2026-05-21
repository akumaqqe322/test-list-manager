import { directClient } from "./client";
import { PaginatedResponse } from "../types";

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToQueue(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyQueue() {
  for (const listener of listeners) {
    listener();
  }
}

// State of holding pending IDs for UI to bind to
const pendingAddIds = new Set<number>();
const pendingSelectIds = new Set<number>();
const pendingUnselectIds = new Set<number>();

export function getPendingAddIds(): Set<number> {
  return pendingAddIds;
}

export function getPendingSelectIds(): Set<number> {
  return pendingSelectIds;
}

export function getPendingUnselectIds(): Set<number> {
  return pendingUnselectIds;
}

// 1. ADD QUEUE
interface AddRequest {
  id: number;
  resolve: (value: { success: boolean; addedId: number }) => void;
  reject: (reason: any) => void;
}
let pendingAddRequests: AddRequest[] = [];
let addTimeout: NodeJS.Timeout | null = null;

function flushAddQueue() {
  addTimeout = null;
  if (pendingAddRequests.length === 0) return;

  const currentBatch = pendingAddRequests;
  pendingAddRequests = [];

  // Deduplicate and gather IDs for request
  const uniqueIdsSet = new Set(currentBatch.map((req) => req.id));
  const idsArray = Array.from(uniqueIdsSet);

  // Remove flushed IDs from the pending visual state
  for (const id of idsArray) {
    pendingAddIds.delete(id);
  }
  notifyQueue();

  directClient
    .addCustomIdsBatch(idsArray)
    .then((res) => {
      // Map results back to resolves/rejects
      const errorsMap = new Map<number, string>();
      for (const err of res.errors) {
        errorsMap.set(Number(err.id), err.reason);
      }

      const skippedSet = new Set(res.skippedIds);
      const addedSet = new Set(res.addedIds);

      for (const req of currentBatch) {
        const errorReason = errorsMap.get(req.id);
        if (errorReason) {
          req.reject(new Error(errorReason));
        } else if (addedSet.has(req.id) || skippedSet.has(req.id)) {
          req.resolve({ success: true, addedId: req.id });
        } else {
          req.resolve({ success: true, addedId: req.id });
        }
      }
    })
    .catch((err) => {
      for (const req of currentBatch) {
        req.reject(err);
      }
    });
}

// 2. CHANGE QUEUE (Select, Unselect, Reorder)
interface SelectRequest {
  id: number;
  resolve: (value: { success: boolean; selectedId: number }) => void;
  reject: (reason: any) => void;
}
interface UnselectRequest {
  id: number;
  resolve: (value: { success: boolean; unselectedId: number }) => void;
  reject: (reason: any) => void;
}
interface ReorderRequest {
  orderedVisibleIds: number[];
  search: string;
  resolve: (value: { success: boolean }) => void;
  reject: (reason: any) => void;
}

let pendingSelectRequests: SelectRequest[] = [];
let pendingUnselectRequests: UnselectRequest[] = [];
let pendingReorderRequests: Map<string, ReorderRequest> = new Map(); // search -> ReorderRequest
let changeTimeout: NodeJS.Timeout | null = null;

function flushChangeQueue() {
  changeTimeout = null;
  const selects = pendingSelectRequests;
  const unselects = pendingUnselectRequests;
  const reorders = Array.from(pendingReorderRequests.values());

  pendingSelectRequests = [];
  pendingUnselectRequests = [];
  pendingReorderRequests.clear();

  // Clear pending sets
  for (const s of selects) pendingSelectIds.delete(s.id);
  for (const u of unselects) pendingUnselectIds.delete(u.id);
  notifyQueue();

  // 2a. Flush Selects
  if (selects.length > 0) {
    const ids = Array.from(new Set(selects.map((s) => s.id)));
    directClient
      .selectItemsBatch(ids)
      .then((res) => {
        const errorsMap = new Map<number, string>();
        for (const err of res.errors) {
          errorsMap.set(Number(err.id), err.reason);
        }
        for (const s of selects) {
          const errMsg = errorsMap.get(s.id);
          if (errMsg) s.reject(new Error(errMsg));
          else s.resolve({ success: true, selectedId: s.id });
        }
      })
      .catch((err) => {
        for (const s of selects) s.reject(err);
      });
  }

  // 2b. Flush Unselects
  if (unselects.length > 0) {
    const ids = Array.from(new Set(unselects.map((u) => u.id)));
    directClient
      .unselectItemsBatch(ids)
      .then((res) => {
        const errorsMap = new Map<number, string>();
        for (const err of res.errors) {
          errorsMap.set(Number(err.id), err.reason);
        }
        for (const u of unselects) {
          const errMsg = errorsMap.get(u.id);
          if (errMsg) u.reject(new Error(errMsg));
          else u.resolve({ success: true, unselectedId: u.id });
        }
      })
      .catch((err) => {
        for (const u of unselects) u.reject(err);
      });
  }

  // 2c. Flush Reorders
  for (const r of reorders) {
    directClient
      .reorderSelectedItems(r.orderedVisibleIds, r.search)
      .then((res) => r.resolve(res))
      .catch((err) => r.reject(err));
  }
}

// 3. READ QUEUE (Cache & Deduplication for Reads with 1s window)
interface ReadRequest {
  type: "available" | "selected";
  search: string;
  cursor: number | null;
  limit: number;
  resolve: (value: PaginatedResponse) => void;
  reject: (reason: any) => void;
}

const pendingReadRequests = new Map<string, ReadRequest[]>(); // key -> request array
let readTimeout: NodeJS.Timeout | null = null;

function flushReadQueue() {
  readTimeout = null;
  const currentReads = new Map(pendingReadRequests);
  pendingReadRequests.clear();

  for (const [key, requests] of Array.from(currentReads.entries())) {
    if (requests.length === 0) continue;
    const firstReq = requests[0];

    const fetchPromise =
      firstReq.type === "available"
        ? directClient.fetchAvailable(firstReq.search, firstReq.cursor, firstReq.limit)
        : directClient.fetchSelected(firstReq.search, firstReq.cursor, firstReq.limit);

    fetchPromise
      .then((data) => {
        for (const req of requests) {
          req.resolve(data);
        }
      })
      .catch((err) => {
        for (const req of requests) {
          req.reject(err);
        }
      });
  }
}

// High level request queue API
export const requestQueue = {
  addCustomId(id: number): Promise<{ success: boolean; addedId: number }> {
    if (pendingAddIds.has(id)) {
      return new Promise((resolve, reject) => {
        pendingAddRequests.push({ id, resolve, reject });
      });
    }

    pendingAddIds.add(id);
    notifyQueue();

    const promise = new Promise<{ success: boolean; addedId: number }>((resolve, reject) => {
      pendingAddRequests.push({ id, resolve, reject });
    });

    if (!addTimeout) {
      addTimeout = setTimeout(flushAddQueue, 10000);
    }
    return promise;
  },

  selectItem(id: number): Promise<{ success: boolean; selectedId: number }> {
    if (pendingSelectIds.has(id)) {
      return new Promise((resolve, reject) => {
        pendingSelectRequests.push({ id, resolve, reject });
      });
    }

    pendingSelectIds.add(id);
    notifyQueue();

    const promise = new Promise<{ success: boolean; selectedId: number }>((resolve, reject) => {
      pendingSelectRequests.push({ id, resolve, reject });
    });

    if (!changeTimeout) {
      changeTimeout = setTimeout(flushChangeQueue, 1000);
    }
    return promise;
  },

  unselectItem(id: number): Promise<{ success: boolean; unselectedId: number }> {
    if (pendingUnselectIds.has(id)) {
      return new Promise((resolve, reject) => {
        pendingUnselectRequests.push({ id, resolve, reject });
      });
    }

    pendingUnselectIds.add(id);
    notifyQueue();

    const promise = new Promise<{ success: boolean; unselectedId: number }>((resolve, reject) => {
      pendingUnselectRequests.push({ id, resolve, reject });
    });

    if (!changeTimeout) {
      changeTimeout = setTimeout(flushChangeQueue, 1000);
    }
    return promise;
  },

  reorderSelectedItems(orderedVisibleIds: number[], search: string): Promise<{ success: boolean }> {
    const promise = new Promise<{ success: boolean }>((resolve, reject) => {
      const key = search;
      const existing = pendingReorderRequests.get(key);
      if (existing) {
        existing.resolve({ success: true });
      }
      pendingReorderRequests.set(key, { orderedVisibleIds, search, resolve, reject });
    });

    if (!changeTimeout) {
      changeTimeout = setTimeout(flushChangeQueue, 1000);
    }
    return promise;
  },

  fetchAvailable(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    const key = `available-${search}-${cursor || 0}-${limit}`;
    const promise = new Promise<PaginatedResponse>((resolve, reject) => {
      const list = pendingReadRequests.get(key) || [];
      list.push({ type: "available", search, cursor, limit, resolve, reject });
      pendingReadRequests.set(key, list);
    });

    if (!readTimeout) {
      readTimeout = setTimeout(flushReadQueue, 1000);
    }
    return promise;
  },

  fetchSelected(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    const key = `selected-${search}-${cursor || 0}-${limit}`;
    const promise = new Promise<PaginatedResponse>((resolve, reject) => {
      const list = pendingReadRequests.get(key) || [];
      list.push({ type: "selected", search, cursor, limit, resolve, reject });
      pendingReadRequests.set(key, list);
    });

    if (!readTimeout) {
      readTimeout = setTimeout(flushReadQueue, 1000);
    }
    return promise;
  },
};
