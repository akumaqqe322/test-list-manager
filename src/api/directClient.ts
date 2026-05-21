import { PaginatedResponse } from "../types";

/**
 * Handles error extraction from standard API responses with detailed diagnostics.
 */
async function handleResponse<T>(
  response: Response,
  options?: { url: string; method?: string; body?: any }
): Promise<T> {
  if (!response.ok) {
    let errorDetail = "";
    try {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data && typeof data.error === "string") {
          errorDetail = data.error;
        } else {
          errorDetail = text;
        }
      } catch {
        errorDetail = text;
      }
    } catch {
      errorDetail = "No body details";
    }

    const method = options?.method || "GET";
    const url = options?.url || response.url;
    const errorMsg = `${method} ${url} failed with ${response.status}: ${errorDetail || response.statusText}`;

    // Log diagnostic payload for rapid developer tracking in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.error("[API Error Diagnostics]", {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        payload: options?.body,
        errorDetail,
      });
    }

    throw new Error(errorMsg);
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

    const url = `/api/items/available?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse<PaginatedResponse>(response, { url, method: "GET" });
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

    const url = `/api/items/selected?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse<PaginatedResponse>(response, { url, method: "GET" });
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
    }>(response, { url: "/api/items/add-batch", method: "POST", body: { ids } });
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
    }>(response, { url: "/api/items/select-batch", method: "POST", body: { ids } });
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
    }>(response, { url: "/api/items/unselect-batch", method: "POST", body: { ids } });
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
    return handleResponse<{ success: boolean; addedId: number }>(response, {
      url: "/api/items/add",
      method: "POST",
      body: { id },
    });
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
    return handleResponse<{ success: boolean; selectedId: number }>(response, {
      url: "/api/items/select",
      method: "POST",
      body: { id },
    });
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
    return handleResponse<{ success: boolean; unselectedId: number }>(response, {
      url: "/api/items/unselect",
      method: "POST",
      body: { id },
    });
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
    return handleResponse<{ success: boolean }>(response, {
      url: "/api/items/reorder",
      method: "POST",
      body: { orderedVisibleIds, search },
    });
  },
};
