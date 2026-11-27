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
      pageSize: query.limit,
      ...(query.search ? { search: query.search } : {}),
      ...(query.sortBy ? { sortBy: query.sortBy, sortOrder: query.sortDirection ?? 'asc' } : {}),
      ...(query.filters && Object.keys(query.filters).length
        ? { filters: JSON.stringify(query.filters) }
        : {}),
      ...(entity.fields.some((field) => !field.sensitive)
        ? { fields: entity.fields.filter((field) => !field.sensitive).map((field) => field.key).join(',') }
        : {}),
    };
    return this.api.get<T[]>(
      entity.endpoint,
      params,
    ).pipe(map((response) => this.normalizePage<T>(response.data, response.meta, query)));
  }

  search<T extends Record<string, unknown>>(entity: EntityMetadata, term: string, query: Partial<CrudQuery> = {}): Observable<CrudPage<T>> {
    return this.list<T>(entity, { ...query, page: query.page ?? 1, limit: query.limit ?? 10, search: term });
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

  private normalizePage<T>(data: unknown, meta: unknown, query: CrudQuery): CrudPage<T> {
    if (Array.isArray(data)) {
      const pagination = typeof meta === 'object' && meta !== null
        ? meta as Record<string, unknown>
        : {};
      const page = this.positiveNumberOr(pagination['page'], query.page);
      const limit = this.positiveNumberOr(pagination['pageSize'], query.limit);
      const total = this.nonNegativeNumberOr(pagination['totalRecords'], data.length);
      return {
        items: data as T[],
        pagination: {
          page,
          limit,
          total,
          totalPages: this.positiveNumberOr(pagination['totalPages'], Math.max(1, Math.ceil(total / limit))),
        },
      };
    }
    if (typeof data === 'object' && data !== null) {
      const paginated = data as Record<string, unknown>;
      const rawItems = paginated['items'] ?? paginated['data'] ?? paginated['results'];
      if (!Array.isArray(rawItems)) {
        throw new Error('The service returned a list response in an unsupported format.');
      }
      const items = rawItems as T[];
      const rawPagination = paginated['pagination'] ?? meta ?? paginated['meta'];
      const pagination = typeof rawPagination === 'object' && rawPagination !== null
        ? rawPagination as Record<string, unknown>
        : {};
      const page = this.positiveNumberOr(pagination['page'], query.page);
      const limit = this.positiveNumberOr(pagination['pageSize'] ?? pagination['limit'], query.limit);
      const total = this.nonNegativeNumberOr(pagination['totalRecords'] ?? pagination['total'], items.length);
      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: this.positiveNumberOr(pagination['totalPages'], Math.max(1, Math.ceil(total / limit))),
        },
      };
    }
    throw new Error('The service returned a list response in an unsupported format.');
  }

  private positiveNumberOr(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private nonNegativeNumberOr(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
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
