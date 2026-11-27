import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiEnvelope, PaginatedData } from '../models/api.models';
import { ApiClientService } from '../services/api-client.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { AuthService } from '../auth/auth.service';
import { LookupMetadata, LookupOption } from './metadata.models';

@Injectable({ providedIn: 'root' })
export class LookupEngine {
  private readonly api = inject(ApiClientService);
  private readonly context = inject(TenantContextService);
  private readonly auth = inject(AuthService);
  private readonly cache = new Map<string, LookupOption[]>();

  search(metadata: LookupMetadata, term = ''): Observable<LookupOption[]> {
    const lookupFilters = metadata.params ?? {};
    const fields = Array.from(new Set([metadata.valueField ?? 'id', metadata.labelField ?? 'name']));
    const params: Record<string, string | number | boolean> = {
      page: 1,
      pageSize: 100,
      fields: fields.join(','),
      ...(term ? { search: term } : {}),
      ...(Object.keys(lookupFilters).length ? { filters: JSON.stringify(lookupFilters) } : {}),
    };
    const user = this.auth.user();
    const cacheKey = `${metadata.endpoint}:${user?.id ?? ''}:${user?.tenantId ?? ''}:${user?.schoolId ?? ''}:${user?.branchId ?? ''}:${user?.academicSessionId ?? ''}:${JSON.stringify(params)}`;
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
    let rows: Record<string, unknown>[];
    if (Array.isArray(data)) {
      rows = data;
    } else if (typeof data === 'object' && data !== null && 'items' in data && Array.isArray(data['items'])) {
      rows = data['items'] as Record<string, unknown>[];
    } else {
      throw new Error('The service returned lookup data in an unsupported format.');
    }
    const labelField = metadata.labelField ?? 'name';
    const valueField = metadata.valueField ?? 'id';
    return rows.flatMap((row) => {
      const value = row[valueField];
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return [];
      const label = String(row[labelField] ?? row['name'] ?? row['label'] ?? '');
      return label ? [{ label, value, data: row }] : [];
    });
  }
}
