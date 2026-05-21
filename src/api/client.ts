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

export const apiClient = {
  /**
   * Fetches paginated list of available items.
   */
  async fetchAvailable(search: string = "", cursor: number | null = null, limit: number = 20): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (cursor !== null && cursor > 0) params.append("cursor", String(cursor));
    params.append("limit", String(limit));

    const response = await fetch(`/api/items/available?${params.toString()}`);
    return handleResponse<PaginatedResponse>(response);
  },

  /**
   * Fetches paginated list of selected items.
   */
  async fetchSelected(search: string = "", cursor: number | null = null, limit: number = 20): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (cursor !== null && cursor > 0) params.append("cursor", String(cursor));
    params.append("limit", String(limit));

    const response = await fetch(`/api/items/selected?${params.toString()}`);
    return handleResponse<PaginatedResponse>(response);
  },

  /**
   * Submits a request to manually add a custom ID.
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
   * Selects an item.
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
   * Unselects an item.
   */
  async unselectItem(id: number): Promise<{ success: boolean; unselectedId: number }> {
    const response = await fetch("/api/items/unselect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return handleResponse<{ success: boolean; unselectedId: number }>(response);
  },
};
