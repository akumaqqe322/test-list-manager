export interface Item {
  id: number;
}

export interface PaginatedResponse {
  items: Item[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface APIError {
  error: string;
}
