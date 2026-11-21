import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ApiEnvelope, PaginatedData } from '../models/api.models';
import { ApiClientService } from '../services/api-client.service';
import { CrudQuery, EntityMetadata } from '../metadata/metadata.models';
import { BulkActionResult, CrudPage } from './crud.models';

@Injectable({ providedIn: 'root' })
export class CrudEngine {
  private readonly api = inject(ApiClientService);

  list<T extends Record<string, unknown>>(entity: EntityMetadata, query: CrudQuery): Observable<CrudPage<T>> {
    const params: Record<string, string | number | boolean> = {
      page: query.page,
      limit: query.limit,
      ...(query.search ? { search: query.search } : {}),
      ...(query.sortBy ? { sortBy: query.sortBy, sortDirection: query.sortDirection ?? 'asc' } : {}),
      ...(query.filters ?? {}),
    };
    return this.api.get<PaginatedData<T> | T[] | { items: T[]; pagination?: Partial<CrudPage<T>['pagination']> }>(
      entity.endpoint,
      params,
    ).pipe(map((response) => this.normalizePage<T>(response.data, query)));
  }

  search<T extends Record<string, unknown>>(entity: EntityMetadata, term: string, query: Partial<CrudQuery> = {}): Observable<CrudPage<T>> {
    return this.list<T>(entity, { page: query.page ?? 1, limit: query.limit ?? 10, search: term, ...query });
  }

  create<T>(entity: EntityMetadata, body: unknown): Observable<T> {
    return this.api.post<T>(entity.endpoint, body).pipe(map((response) => response.data));
  }

  update<T>(entity: EntityMetadata, id: string | number, body: unknown): Observable<T> {
    return this.api.patch<T>(`${entity.endpoint}/${id}`, body).pipe(map((response) => response.data));
  }

  details<T>(entity: EntityMetadata, id: string | number): Observable<T> {
    return this.api.get<T>(`${entity.endpoint}/${id}`).pipe(map((response) => response.data));
  }

  delete(entity: EntityMetadata, id: string | number): Observable<void> {
    return this.api.delete<unknown>(`${entity.endpoint}/${id}`).pipe(map(() => undefined));
  }

  bulkDelete(entity: EntityMetadata, ids: Array<string | number>): Observable<BulkActionResult> {
    if (!ids.length) return new Observable((subscriber) => {
      subscriber.next({ succeeded: 0, failed: 0 });
      subscriber.complete();
    });
    return forkJoin(ids.map((id) => this.delete(entity, id).pipe(
      map(() => true),
      catchError(() => of(false)),
    ))).pipe(map((results) => ({
      succeeded: results.filter(Boolean).length,
      failed: results.filter((result) => !result).length,
    })));
  }

  import<T>(entity: EntityMetadata, file: File): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<T>(`${entity.endpoint}/import`, formData).pipe(map((response) => response.data));
  }

  export(entity: EntityMetadata, rows: Array<Record<string, unknown>>, format: 'csv' | 'json' = 'csv'): void {
    const content = format === 'json'
      ? JSON.stringify(rows, null, 2)
      : this.toCsv(rows);
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${entity.key}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private normalizePage<T>(data: unknown, query: CrudQuery): CrudPage<T> {
    if (Array.isArray(data)) {
      return {
        items: data as T[],
        pagination: { page: query.page, limit: query.limit, total: data.length, totalPages: Math.max(1, Math.ceil(data.length / query.limit)) },
      };
    }
    if (typeof data === 'object' && data !== null) {
      const paginated = data as {
        items?: T[];
        data?: T[];
        results?: T[];
        pagination?: Partial<CrudPage<T>['pagination']>;
        meta?: Partial<CrudPage<T>['pagination']>;
      };
      const items = paginated.items ?? paginated.data ?? paginated.results ?? [];
      const pagination = paginated.pagination ?? paginated.meta ?? {};
      return {
        items,
        pagination: {
          page: pagination.page ?? query.page,
          limit: pagination.limit ?? query.limit,
          total: pagination.total ?? items.length,
          totalPages: pagination.totalPages ?? Math.max(1, Math.ceil((pagination.total ?? items.length) / (pagination.limit ?? query.limit))),
        },
      };
    }
    return {
      items: [],
      pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
    };
  }

  private toCsv(rows: Array<Record<string, unknown>>): string {
    if (!rows.length) return '';
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [
      keys.map(escape).join(','),
      ...rows.map((row) => keys.map((key) => escape(row[key])).join(',')),
    ].join('\n');
  }
}
