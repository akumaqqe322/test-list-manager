/**
 * In-memory state and operations for the Virtual List Manager.
 */

// Stores manually added custom numeric IDs (can be outside the 1..1,000,000 range)
export const manuallyAddedIds = new Set<number>();

// Stores selected IDs for content filter/lookup
export const selectedIds = new Set<number>();

// Stores the selected ID order (for drag and drop sorting later)
export let selectedOrder: number[] = [];

// Base virtual range configuration
export const MIN_BASE_ID = 1;
export const MAX_BASE_ID = 1000000;

/**
 * Validates whether an ID is a positive safe integer.
 */
export function isValidId(id: any): id is number {
  return (
    typeof id === "number" &&
    Number.isSafeInteger(id) &&
    id > 0
  );
}

/**
 * Checks if an ID exists in either the base virtual range or manually added custom IDs.
 */
export function itemExists(id: number): boolean {
  if (id >= MIN_BASE_ID && id <= MAX_BASE_ID) {
    return true;
  }
  return manuallyAddedIds.has(id);
}

/**
 * Query available items with filtering and pagination.
 * 
 * Available items = (Base virtual range + manually added custom IDs) - Selected IDs
 */
export interface PaginatedResult {
  items: { id: number }[];
  nextCursor: number | null;
  hasMore: boolean;
}

export function getAvailableItems(
  search: string = "",
  cursor: number = 0,
  limit: number = 20
): PaginatedResult {
  const limitVal = Math.min(limit, 20);
  const results: { id: number }[] = [];
  
  // Clean search input, normalize to lowercase
  const searchStr = search.trim();
  const hasSearch = searchStr.length > 0;
  
  // Quick pre-check optimization: 
  // If search is not numeric, no virtual ID (1..1,000,000) can ever match.
  // Also, any search string of length > 7 cannot match any virtual ID.
  // And a 7-digit search string only matches if it's "1000000".
  const isSearchNumeric = !hasSearch || /^\d+$/.test(searchStr);
  const canVirtualMatch = isSearchNumeric && 
    (searchStr.length < 7 || (searchStr.length === 7 && searchStr === "1000000"));

  // Start scanning elements from cursor + 1
  let currentId = cursor > 0 ? cursor + 1 : 1;

  // Cache sorted custom IDs that are greater than or equal to currentId and NOT selected
  const customIdsSorted = Array.from(manuallyAddedIds)
    .filter(id => id >= currentId && !selectedIds.has(id))
    .sort((a, b) => a - b);
  
  let customIdx = 0;
  let virtualId: number | null = canVirtualMatch && currentId <= MAX_BASE_ID ? currentId : null;

  // We fetch up to limitVal + 1 to determine if there are more items to paginate
  while (results.length < limitVal + 1) {
    // 1. Find the next valid, unselected virtual ID (applying search filter if present)
    if (virtualId !== null) {
      while (virtualId <= MAX_BASE_ID) {
        if (!selectedIds.has(virtualId)) {
          if (!hasSearch || String(virtualId).indexOf(searchStr) !== -1) {
            break; // Valid virtual ID found
          }
        }
        virtualId++;
      }
      if (virtualId > MAX_BASE_ID) {
        virtualId = null;
      }
    }

    // 2. Find the next custom ID that matches search
    let nextCustom: number | null = null;
    while (customIdx < customIdsSorted.length) {
      const candidate = customIdsSorted[customIdx];
      if (!hasSearch || String(candidate).indexOf(searchStr) !== -1) {
        nextCustom = candidate;
        break;
      }
      customIdx++;
    }

    const nextVirtual = virtualId;

    // 3. Compare and select the smaller of nextVirtual and nextCustom to preserve ascending order
    let chosenId: number | null = null;

    if (nextVirtual !== null && nextCustom !== null) {
      if (nextVirtual < nextCustom) {
        chosenId = nextVirtual;
        virtualId!++; // advance virtual search
      } else if (nextCustom < nextVirtual) {
        chosenId = nextCustom;
        customIdx++; // advance custom search
      } else {
        // If they are equal (shouldn't happen under duplicate validation, but safe-fallback)
        chosenId = nextVirtual;
        virtualId!++;
        customIdx++;
      }
    } else if (nextVirtual !== null) {
      chosenId = nextVirtual;
      virtualId!++;
    } else if (nextCustom !== null) {
      chosenId = nextCustom;
      customIdx++;
    } else {
      break; // No more available items
    }

    if (chosenId !== null) {
      results.push({ id: chosenId });
    }
  }

  const hasMore = results.length > limitVal;
  const slicedItems = hasMore ? results.slice(0, limitVal) : results;
  const nextCursor = slicedItems.length > 0 && hasMore ? slicedItems[slicedItems.length - 1].id : null;

  return {
    items: slicedItems,
    nextCursor,
    hasMore,
  };
}

/**
 * Query selected items in their user-ordered sequence.
 */
export function getSelectedItems(
  search: string = "",
  cursor: number = 0,
  limit: number = 20
): PaginatedResult {
  const limitVal = Math.min(limit, 20);
  const searchStr = search.trim();
  const hasSearch = searchStr.length > 0;

  // 1. Filter the selectedOrder array by search criteria
  const filteredSelected = selectedOrder.filter(id => {
    if (hasSearch) {
      return String(id).indexOf(searchStr) !== -1;
    }
    return true;
  });

  // 2. Paginate starting from the cursor ID (finding its index in the filtered selected array)
  let startIndex = 0;
  if (cursor > 0) {
    const idx = filteredSelected.indexOf(cursor);
    if (idx !== -1) {
      startIndex = idx + 1;
    }
  }

  const endSlice = startIndex + limitVal;
  const slicedItems = filteredSelected.slice(startIndex, endSlice).map(id => ({ id }));
  
  const hasMore = filteredSelected.length > endSlice;
  const nextCursor = slicedItems.length > 0 && hasMore ? slicedItems[slicedItems.length - 1].id : null;

  return {
    items: slicedItems,
    nextCursor,
    hasMore,
  };
}

/**
 * Adds a custom ID to the memory database.
 */
export function addCustomId(id: number): void {
  manuallyAddedIds.add(id);
}

/**
 * Selects an ID and appends it to selected list.
 */
export function selectItem(id: number): void {
  selectedIds.add(id);
  selectedOrder.push(id);
}

/**
 * Unselects an ID and removes it from selected list.
 */
export function unselectItem(id: number): void {
  selectedIds.delete(id);
  selectedOrder = selectedOrder.filter(item => item !== id);
}

/**
 * Allows updating the selected order (for potential sort/reorder operations)
 */
export function updateSelectedOrder(newOrder: number[]): void {
  selectedOrder = [...newOrder];
  
  // Re-sync selectedIds Set
  selectedIds.clear();
  for (const id of selectedOrder) {
    selectedIds.add(id);
  }
}

/**
 * Reorders only the selected IDs that are visible under the current filter/search.
 * Keeps hidden/unloaded selected IDs in their previous positions.
 */
export function reorderSelectedVisible(orderedVisibleIds: number[], search: string): void {
  const searchStr = search.trim();
  const hasSearch = searchStr.length > 0;
  
  // Create a set of IDs to reorder (the ones supplied from the front-end)
  const toReorderSet = new Set(orderedVisibleIds);

  let replacementIdx = 0;
  const newOrder = selectedOrder.map(id => {
    if (toReorderSet.has(id)) {
      const replacement = orderedVisibleIds[replacementIdx];
      replacementIdx++;
      return replacement;
    }
    return id;
  });

  selectedOrder = newOrder;
  
  // Re-sync selectedIds Set just in case
  selectedIds.clear();
  for (const id of selectedOrder) {
    selectedIds.add(id);
  }
}
