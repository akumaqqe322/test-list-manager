import { PaginatedResponse } from "../types";
import { requestQueue } from "./requestQueue";
import { directClient } from "./directClient";

export const apiClient = {
  fetchAvailable(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    return requestQueue.fetchAvailable(search, cursor, limit);
  },

  fetchAvailableImmediate(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    return directClient.fetchAvailable(search, cursor, limit);
  },

  fetchSelected(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    return requestQueue.fetchSelected(search, cursor, limit);
  },

  fetchSelectedImmediate(
    search: string = "",
    cursor: number | null = null,
    limit: number = 20
  ): Promise<PaginatedResponse> {
    return directClient.fetchSelected(search, cursor, limit);
  },

  addCustomId(id: number): Promise<{ success: boolean; addedId: number }> {
    return requestQueue.addCustomId(id);
  },

  selectItem(id: number): Promise<{ success: boolean; selectedId: number }> {
    return requestQueue.selectItem(id);
  },

  unselectItem(id: number): Promise<{ success: boolean; unselectedId: number }> {
    return requestQueue.unselectItem(id);
  },

  reorderSelectedItems(orderedVisibleIds: number[], search: string): Promise<{ success: boolean }> {
    return requestQueue.reorderSelectedItems(orderedVisibleIds, search);
  },
};
