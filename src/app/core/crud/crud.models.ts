export interface CrudPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CrudPage<T> {
  items: T[];
  pagination: CrudPagination;
}

export interface BulkActionResult {
  succeeded: number;
  failed: number;
}
