import { directClient } from "./directClient";
import { PaginatedResponse } from "../types";

export class AbortError extends Error {
  override name = "AbortError";
  constructor(message: string) {
    super(message);
  }
}

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

// Visual State Tracking
const pendingAddIds = new Set<number>();
const inFlightAddIds = new Set<number>();

const pendingSelectIds = new Set<number>();
const inFlightSelectIds = new Set<number>();

const pendingUnselectIds = new Set<number>();
const inFlightUnselectIds = new Set<number>();

const knownSelectedIds = new Set<number>();

export function getPendingAddIds(): Set<number> {
  return new Set([...Array.from(pendingAddIds), ...Array.from(inFlightAddIds)]);
}

export function getPendingSelectIds(): Set<number> {
  return new Set([...Array.from(pendingSelectIds), ...Array.from(inFlightSelectIds)]);
}

export function getPendingUnselectIds(): Set<number> {
  return new Set([...Array.from(pendingUnselectIds), ...Array.from(inFlightUnselectIds)]);
}

export function getKnownSelectedIds(): Set<number> {
  return new Set(knownSelectedIds);
}

interface Settler<T> {
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

// 1. ADD QUEUE
const pendingAddPromises = new Map<number, Promise<{ success: boolean; addedId: number }>>();
const inFlightAddPromises = new Map<number, Promise<{ success: boolean; addedId: number }>>();
const pendingAddSettlers = new Map<number, Settler<{ success: boolean; addedId: number }>>();
const inFlightAddSettlers = new Map<number, Settler<{ success: boolean; addedId: number }>>();

let addTimeout: NodeJS.Timeout | null = null;

function flushAddQueue() {
  addTimeout = null;
  if (pendingAddIds.size === 0) return;

  const idsToFlush = Array.from(pendingAddIds);
  const settlersSnapshot = new Map(pendingAddSettlers);
  const promisesSnapshot = new Map(pendingAddPromises);

  pendingAddIds.clear();
  pendingAddSettlers.clear();
  pendingAddPromises.clear();

  // Mark as in-flight
  for (const id of idsToFlush) {
    inFlightAddIds.add(id);
    const settler = settlersSnapshot.get(id);
    const prom = promisesSnapshot.get(id);
    if (settler) inFlightAddSettlers.set(id, settler);
    if (prom) inFlightAddPromises.set(id, prom);
  }
  notifyQueue();

  directClient
    .addCustomIdsBatch(idsToFlush)
    .then((res) => {
      const errorsMap = new Map<number, string>();
      for (const err of res.errors) {
        errorsMap.set(Number(err.id), err.reason);
      }

      const skippedSet = new Set(res.skippedIds);
      const addedSet = new Set(res.addedIds);

      for (const id of idsToFlush) {
        const errorReason = errorsMap.get(id);
        const settler = inFlightAddSettlers.get(id);
        if (settler) {
          if (errorReason) {
            settler.reject(new Error(errorReason));
          } else {
            settler.resolve({ success: true, addedId: id });
          }
        }
      }
    })
    .catch((err) => {
      for (const id of idsToFlush) {
        const settler = inFlightAddSettlers.get(id);
        if (settler) settler.reject(err);
      }
    })
    .finally(() => {
      for (const id of idsToFlush) {
        inFlightAddIds.delete(id);
        inFlightAddSettlers.delete(id);
        inFlightAddPromises.delete(id);
      }
      notifyQueue();
    });
}

// 2. CHANGE QUEUE (Select, Unselect, Reorder)
const pendingSelectPromises = new Map<number, Promise<{ success: boolean; selectedId: number }>>();
const inFlightSelectPromises = new Map<number, Promise<{ success: boolean; selectedId: number }>>();
const pendingSelectSettlers = new Map<number, Settler<{ success: boolean; selectedId: number }>>();
const inFlightSelectSettlers = new Map<number, Settler<{ success: boolean; selectedId: number }>>();

const pendingUnselectPromises = new Map<
  number,
  Promise<{ success: boolean; unselectedId: number }>
>();
const inFlightUnselectPromises = new Map<
  number,
  Promise<{ success: boolean; unselectedId: number }>
>();
const pendingUnselectSettlers = new Map<
  number,
  Settler<{ success: boolean; unselectedId: number }>
>();
const inFlightUnselectSettlers = new Map<
  number,
  Settler<{ success: boolean; unselectedId: number }>
>();

interface ReorderRequest {
  orderedVisibleIds: number[];
  search: string;
  resolve: (value: { success: boolean }) => void;
  reject: (reason: any) => void;
}

const pendingReorderRequests = new Map<string, ReorderRequest>(); // search -> ReorderRequest
let changeTimeout: NodeJS.Timeout | null = null;

async function flushChangeQueue() {
  changeTimeout = null;

  // Snapshot selects to flush
  const selectsToFlush = Array.from(pendingSelectIds);
  const selectSettlersSnapshot = new Map(pendingSelectSettlers);
  const selectPromisesSnapshot = new Map(pendingSelectPromises);

  pendingSelectIds.clear();
  pendingSelectSettlers.clear();
  pendingSelectPromises.clear();

  for (const id of selectsToFlush) {
    inFlightSelectIds.add(id);
    const settler = selectSettlersSnapshot.get(id);
    const prom = selectPromisesSnapshot.get(id);
    if (settler) inFlightSelectSettlers.set(id, settler);
    if (prom) inFlightSelectPromises.set(id, prom);
  }

  // Snapshot unselects to flush
  const unselectsToFlush = Array.from(pendingUnselectIds);
  const unselectSettlersSnapshot = new Map(pendingUnselectSettlers);
  const unselectPromisesSnapshot = new Map(pendingUnselectPromises);

  pendingUnselectIds.clear();
  pendingUnselectSettlers.clear();
  pendingUnselectPromises.clear();

  for (const id of unselectsToFlush) {
    inFlightUnselectIds.add(id);
    const settler = unselectSettlersSnapshot.get(id);
    const prom = unselectPromisesSnapshot.get(id);
    if (settler) inFlightUnselectSettlers.set(id, settler);
    if (prom) inFlightUnselectPromises.set(id, prom);
  }

  // Snapshot reorders to flush
  const reordersToFlush = Array.from(pendingReorderRequests.entries());
  pendingReorderRequests.clear();

  notifyQueue();

  // DETERMINISTIC SEQUENCE:
  // 1. select-batch
  if (selectsToFlush.length > 0) {
    try {
      const res = await directClient.selectItemsBatch(selectsToFlush);
      const errorsMap = new Map<number, string>();
      for (const err of res.errors) {
        errorsMap.set(Number(err.id), err.reason);
      }
      for (const id of selectsToFlush) {
        const errMsg = errorsMap.get(id);
        const settler = inFlightSelectSettlers.get(id);
        if (settler) {
          if (errMsg) {
            settler.reject(new Error(errMsg));
          } else {
            knownSelectedIds.add(id);
            settler.resolve({ success: true, selectedId: id });
          }
        }
      }
      invalidateReadQueue();
    } catch (err: any) {
      for (const id of selectsToFlush) {
        const settler = inFlightSelectSettlers.get(id);
        if (settler) settler.reject(err);
      }
    } finally {
      for (const id of selectsToFlush) {
        inFlightSelectIds.delete(id);
        inFlightSelectSettlers.delete(id);
        inFlightSelectPromises.delete(id);
      }
      notifyQueue();
    }
  }

  // 2. unselect-batch
  if (unselectsToFlush.length > 0) {
    try {
      const res = await directClient.unselectItemsBatch(unselectsToFlush);
      const errorsMap = new Map<number, string>();
      for (const err of res.errors) {
        errorsMap.set(Number(err.id), err.reason);
      }
      for (const id of unselectsToFlush) {
        const errMsg = errorsMap.get(id);
        const settler = inFlightUnselectSettlers.get(id);
        if (settler) {
          if (errMsg) {
            settler.reject(new Error(errMsg));
          } else {
            knownSelectedIds.delete(id);
            settler.resolve({ success: true, unselectedId: id });
          }
        }
      }
      invalidateReadQueue();
    } catch (err: any) {
      for (const id of unselectsToFlush) {
        const settler = inFlightUnselectSettlers.get(id);
        if (settler) settler.reject(err);
      }
    } finally {
      for (const id of unselectsToFlush) {
        inFlightUnselectIds.delete(id);
        inFlightUnselectSettlers.delete(id);
        inFlightUnselectPromises.delete(id);
      }
      notifyQueue();
    }
  }

  // 3. reorder
  if (reordersToFlush.length > 0) {
    for (const [_, req] of reordersToFlush) {
      try {
        const res = await directClient.reorderSelectedItems(req.orderedVisibleIds, req.search);
        req.resolve(res);
      } catch (err: any) {
        req.reject(err);
      }
    }
  }
}

// 3. READ QUEUE
interface ReadMeta {
  type: "available" | "selected";
  search: string;
  cursor: number | null;
  limit: number;
}
const pendingReadPromises = new Map<string, Promise<PaginatedResponse>>();
const pendingReadSettlers = new Map<string, Settler<PaginatedResponse>[]>();
const pendingReadMeta = new Map<string, ReadMeta>();
let readTimeout: NodeJS.Timeout | null = null;

export function invalidateReadQueue() {
  if (readTimeout) {
    clearTimeout(readTimeout);
    readTimeout = null;
  }
  // Reject currently pending read promises to ensure outdated results are canceled
  for (const [key, settlersList] of Array.from(pendingReadSettlers.entries())) {
    for (const s of settlersList) {
      s.reject(new AbortError("Query cancelled due to state invalidation"));
    }
  }
  pendingReadSettlers.clear();
  pendingReadPromises.clear();
  pendingReadMeta.clear();
}

function flushReadQueue() {
  readTimeout = null;
  const settlersSnapshot = new Map(pendingReadSettlers);
  const promisesSnapshot = new Map(pendingReadPromises);
  const metaSnapshot = new Map(pendingReadMeta);

  pendingReadSettlers.clear();
  pendingReadPromises.clear();
  pendingReadMeta.clear();

  for (const [key, settlersList] of Array.from(settlersSnapshot.entries())) {
    const meta = metaSnapshot.get(key);
    if (!meta) continue;

    const fetchPromise =
      meta.type === "available"
        ? directClient.fetchAvailable(meta.search, meta.cursor, meta.limit)
        : directClient.fetchSelected(meta.search, meta.cursor, meta.limit);

    fetchPromise
      .then((data) => {
        if (meta.type === "selected") {
          for (const item of data.items) {
            knownSelectedIds.add(item.id);
          }
        } else if (meta.type === "available") {
          for (const item of data.items) {
            knownSelectedIds.delete(item.id);
          }
        }
        for (const s of settlersList) {
          s.resolve(data);
        }
        notifyQueue();
      })
      .catch((err) => {
        for (const s of settlersList) {
          s.reject(err);
        }
      });
  }
}

export const requestQueue = {
  addCustomId(id: number): Promise<{ success: boolean; addedId: number }> {
    if (pendingAddPromises.has(id)) {
      return pendingAddPromises.get(id)!;
    }
    if (inFlightAddPromises.has(id)) {
      return inFlightAddPromises.get(id)!;
    }

    pendingAddIds.add(id);
    notifyQueue();

    const promise = new Promise<{ success: boolean; addedId: number }>((resolve, reject) => {
      pendingAddSettlers.set(id, { resolve, reject });
    });

    pendingAddPromises.set(id, promise);

    if (!addTimeout) {
      addTimeout = setTimeout(flushAddQueue, 10000);
    }
    return promise;
  },

  selectItem(id: number): Promise<{ success: boolean; selectedId: number }> {
    // Conflict compaction: if ununselect is pending, override it
    if (pendingUnselectIds.has(id)) {
      const settler = pendingUnselectSettlers.get(id);
      if (settler) {
        settler.resolve({ success: true, unselectedId: id, overridden: true } as any);
      }
      pendingUnselectIds.delete(id);
      pendingUnselectSettlers.delete(id);
      pendingUnselectPromises.delete(id);
    }

    if (pendingSelectPromises.has(id)) {
      return pendingSelectPromises.get(id)!;
    }
    if (inFlightSelectPromises.has(id)) {
      return inFlightSelectPromises.get(id)!;
    }

    pendingSelectIds.add(id);
    notifyQueue();

    const promise = new Promise<{ success: boolean; selectedId: number }>((resolve, reject) => {
      pendingSelectSettlers.set(id, { resolve, reject });
    });

    pendingSelectPromises.set(id, promise);

    if (!changeTimeout) {
      changeTimeout = setTimeout(flushChangeQueue, 1000);
    }
    return promise;
  },

  unselectItem(id: number): Promise<{ success: boolean; unselectedId: number }> {
    // Conflict compaction: if select is pending, override it
    if (pendingSelectIds.has(id)) {
      const settler = pendingSelectSettlers.get(id);
      if (settler) {
        settler.resolve({ success: true, selectedId: id, overridden: true } as any);
      }
      pendingSelectIds.delete(id);
      pendingSelectSettlers.delete(id);
      pendingSelectPromises.delete(id);
    }

    if (pendingUnselectPromises.has(id)) {
      return pendingUnselectPromises.get(id)!;
    }
    if (inFlightUnselectPromises.has(id)) {
      return inFlightUnselectPromises.get(id)!;
    }

    pendingUnselectIds.add(id);
    notifyQueue();

    const promise = new Promise<{ success: boolean; unselectedId: number }>((resolve, reject) => {
      pendingUnselectSettlers.set(id, { resolve, reject });
    });

    pendingUnselectPromises.set(id, promise);

    if (!changeTimeout) {
      changeTimeout = setTimeout(flushChangeQueue, 1000);
    }
    return promise;
  },

  reorderSelectedItems(orderedVisibleIds: number[], search: string): Promise<{ success: boolean }> {
    const key = search;
    const existing = pendingReorderRequests.get(key);
    if (existing) {
      existing.reject(new AbortError("Reorder request superseded by a newer reorder"));
    }

    const promise = new Promise<{ success: boolean }>((resolve, reject) => {
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
    if (pendingReadPromises.has(key)) {
      return pendingReadPromises.get(key)!;
    }

    const promise = new Promise<PaginatedResponse>((resolve, reject) => {
      const settlers = pendingReadSettlers.get(key) || [];
      settlers.push({ resolve, reject });
      pendingReadSettlers.set(key, settlers);
    });

    pendingReadPromises.set(key, promise);
    pendingReadMeta.set(key, { type: "available", search, cursor, limit });

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
    if (pendingReadPromises.has(key)) {
      return pendingReadPromises.get(key)!;
    }

    const promise = new Promise<PaginatedResponse>((resolve, reject) => {
      const settlers = pendingReadSettlers.get(key) || [];
      settlers.push({ resolve, reject });
      pendingReadSettlers.set(key, settlers);
    });

    pendingReadPromises.set(key, promise);
    pendingReadMeta.set(key, { type: "selected", search, cursor, limit });

    if (!readTimeout) {
      readTimeout = setTimeout(flushReadQueue, 1000);
    }
    return promise;
  },
};
