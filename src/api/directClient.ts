import { PaginatedResponse } from "../types";

/**
 * Handles error extraction from standard API responses.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const data = await response.json();
      if (data && typeof data.error === "string") {
        errorMessage = data.error;
      }
    } catch {
      // ignore json parse error, fall back to default
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const directClient = {
  /**
   * Fetches paginated list of available items directly from the server.
   */
  async fetchAvailable(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (cursor !== null && cursor > 0) params.append("cursor", String(cursor));
    params.append("limit", String(limit));

    const response = await fetch(`/api/items/available?${params.toString()}`);
    return handleResponse<PaginatedResponse>(response);
  },

  /**
   * Fetches paginated list of selected items directly from the server.
   */
  async fetchSelected(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (cursor !== null && cursor > 0) params.append("cursor", String(cursor));
    params.append("limit", String(limit));

    const response = await fetch(`/api/items/selected?${params.toString()}`);
    return handleResponse<PaginatedResponse>(response);
  },

  /**
   * Batches custom IDs creation request directly to the server.
   */
  async addCustomIdsBatch(ids: number[]): Promise<{
    success: boolean;
    addedIds: number[];
    skippedIds: number[];
    errors: { id: any; reason: string }[];
  }> {
    const response = await fetch("/api/items/add-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    return handleResponse<{
      success: boolean;
      addedIds: number[];
      skippedIds: number[];
      errors: { id: any; reason: string }[];
    }>(response);
  },

  /**
   * Batches selection of items directly to the server.
   */
  async selectItemsBatch(ids: number[]): Promise<{
    success: boolean;
    selectedIds: number[];
    skippedIds: number[];
    errors: { id: any; reason: string }[];
  }> {
    const response = await fetch("/api/items/select-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    return handleResponse<{
      success: boolean;
      selectedIds: number[];
      skippedIds: number[];
      errors: { id: any; reason: string }[];
    }>(response);
  },

  /**
   * Batches unselection of items directly to the server.
   */
  async unselectItemsBatch(ids: number[]): Promise<{
    success: boolean;
    unselectedIds: number[];
    skippedIds: number[];
    errors: { id: any; reason: string }[];
  }> {
    const response = await fetch("/api/items/unselect-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    return handleResponse<{
      success: boolean;
      unselectedIds: number[];
      skippedIds: number[];
      errors: { id: any; reason: string }[];
    }>(response);
  },

  /**
   * Submits a request to manually add a single custom ID.
   */
  async addCustomId(id: number): Promise<{ success: boolean; addedId: number }> {
    const response = await fetch("/api/items/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return handleResponse<{ success: boolean; addedId: number }>(response);
  },

  /**
   * Selects a single item.
   */
  async selectItem(id: number): Promise<{ success: boolean; selectedId: number }> {
    const response = await fetch("/api/items/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return handleResponse<{ success: boolean; selectedId: number }>(response);
  },

  /**
   * Unselects a single item.
   */
  async unselectItem(id: number): Promise<{ success: boolean; unselectedId: number }> {
    const response = await fetch("/api/items/unselect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return handleResponse<{ success: boolean; unselectedId: number }>(response);
  },

  /**
   * Reorders visible elements in selected list under search filter directly.
   */
  async reorderSelectedItems(
    orderedVisibleIds: number[],
    search: string
  ): Promise<{ success: boolean }> {
    const response = await fetch("/api/items/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedVisibleIds, search }),
    });
    return handleResponse<{ success: boolean }>(response);
  },
};
