import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiEnvelope, PaginatedData } from '../models/api.models';
import { ApiClientService } from '../services/api-client.service';
import { LookupMetadata, LookupOption } from './metadata.models';

@Injectable({ providedIn: 'root' })
export class LookupEngine {
  private readonly api = inject(ApiClientService);
  private readonly cache = new Map<string, LookupOption[]>();

  search(metadata: LookupMetadata, term = ''): Observable<LookupOption[]> {
    const params: Record<string, string | number | boolean> = {
      ...(metadata.params ?? {}),
      ...(term ? { [metadata.searchParam ?? 'search']: term } : {}),
    };
    const cacheKey = `${metadata.endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return of(cached);

    return this.api.get<PaginatedData<Record<string, unknown>> | Record<string, unknown>[]>(
      metadata.endpoint,
      params,
    ).pipe(
      map((response) => this.normalize(response.data, metadata)),
      map((options) => {
        this.cache.set(cacheKey, options);
        return options;
      }),
      catchError(() => of([])),
    );
  }

  clearCache(endpoint?: string): void {
    if (endpoint) {
      for (const key of this.cache.keys()) if (key.startsWith(`${endpoint}:`)) this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private normalize(
    data: PaginatedData<Record<string, unknown>> | Record<string, unknown>[] | unknown,
    metadata: LookupMetadata,
  ): LookupOption[] {
    const rows = Array.isArray(data)
      ? data
      : typeof data === 'object' && data !== null && 'items' in data
        ? (data as PaginatedData<Record<string, unknown>>).items
        : [];
    const labelField = metadata.labelField ?? 'name';
    const valueField = metadata.valueField ?? 'id';
    return rows.map((row) => ({
      label: String(row[labelField] ?? row.name ?? row.label ?? ''),
      value: row[valueField] as string | number | boolean,
      data: row,
    }));
  }
}
