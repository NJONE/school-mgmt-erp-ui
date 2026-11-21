import { Injectable } from '@angular/core';
import { FilterMetadata } from './metadata.models';

@Injectable({ providedIn: 'root' })
export class DynamicFilterEngine {
  serialize(filters: FilterMetadata[], values: Record<string, unknown>): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    for (const filter of filters) {
      const value = values[filter.key];
      if (value !== undefined && value !== null && value !== '') {
        result[filter.key] = typeof value === 'boolean' || typeof value === 'number' ? value : String(value);
      }
    }
    return result;
  }

  reset(values: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.keys(values).map((key) => [key, '']));
  }
}
