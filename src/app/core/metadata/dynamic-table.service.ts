import { Injectable } from '@angular/core';
import { TableMetadata } from './metadata.models';

@Injectable({ providedIn: 'root' })
export class DynamicTableEngine {
  getColumns(table?: TableMetadata): TableMetadata['columns'] {
    return table?.columns ?? [];
  }

  sortRows(rows: Record<string, unknown>[], key: string, direction: 'asc' | 'desc'): Record<string, unknown>[] {
    return [...rows].sort((a, b) => {
      const left = a[key] ?? '';
      const right = b[key] ?? '';
      const comparison = String(left).localeCompare(String(right), undefined, { numeric: true });
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  getValue(row: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce<unknown>((value, segment) => {
      if (typeof value === 'object' && value !== null) {
        return (value as Record<string, unknown>)[segment];
      }
      return undefined;
    }, row);
  }

  format(table: TableMetadata | undefined, key: string, value: unknown, row: Record<string, unknown>): string {
    const column = table?.columns.find((item) => item.key === key);
    if (column?.format) return column.format(value, row);
    if (value === null || value === undefined || value === '') return '—';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}
