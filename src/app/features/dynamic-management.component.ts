import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiError } from '../core/models/api.models';
import { EntityMetadataRegistry } from '../core/metadata/entity-registry.service';
import { DynamicFormEngine } from '../core/metadata/dynamic-form.service';
import { DynamicTableEngine } from '../core/metadata/dynamic-table.service';
import { DynamicFilterEngine } from '../core/metadata/dynamic-filter.service';
import { LookupEngine } from '../core/metadata/lookup.service';
import { EntityMetadata, FieldMetadata, LookupOption } from '../core/metadata/metadata.models';
import { CrudEngine } from '../core/crud/crud-engine.service';

@Component({
  selector: 'app-dynamic-management',
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div><p>Management</p><h1>{{ entity()?.pluralLabel ?? 'Records' }}</h1></div>
        <div class="header-actions">
          <button type="button" class="secondary-button" (click)="fileInput.click()">Import</button>
          <input #fileInput class="file-input" type="file" accept=".csv,.json" (change)="importFile($event)" />
          <button type="button" class="secondary-button" (click)="exportRows()">Export</button>
          <button type="button" class="action-button" (click)="openCreate()">＋ Add {{ entity()?.label }}</button>
        </div>
      </header>

      @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }

      @if (entity(); as current) {
        <section class="toolbar">
          @if (current.table?.searchable) {
            <input class="search" type="search" [(ngModel)]="searchTerm" (ngModelChange)="search()" placeholder="Search {{ current.pluralLabel }}" />
          }
          @for (filter of current.filters ?? []; track filter.key) {
            @if (filter.type === 'select') {
              <select [(ngModel)]="filterValues[filter.key]" (ngModelChange)="applyFilters()" [attr.aria-label]="filter.label">
                <option value="">All {{ filter.label }}</option>
                @for (option of filter.options ?? []; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            } @else {
              <input [(ngModel)]="filterValues[filter.key]" (ngModelChange)="applyFilters()" [type]="filter.type === 'date' ? 'date' : 'text'" [placeholder]="filter.label" />
            }
          }
          @if (selectedIds().length) {
            <button type="button" class="danger-button" (click)="bulkDelete()">Delete selected ({{ selectedIds().length }})</button>
          }
        </section>

        <section class="table-card">
          @if (loading()) {
            <div class="loading">Loading {{ current.pluralLabel }}…</div>
          } @else {
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th class="checkbox-column"><input type="checkbox" [checked]="allSelected()" (change)="toggleAll()" aria-label="Select all rows" /></th>
                    @for (column of tableColumns(); track column.key) {
                      <th [style.width.px]="column.width ?? null">
                        <button type="button" [disabled]="!column.sortable" (click)="sort(column.key)">
                          {{ column.label }} @if (sortBy() === column.key) { {{ sortDirection() === 'asc' ? '▲' : '▼' }} }
                        </button>
                      </th>
                    }
                    <th class="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track rowId(row)) {
                    <tr>
                      <td><input type="checkbox" [checked]="selectedIds().includes(rowId(row))" (change)="toggleRow(row)" [attr.aria-label]="'Select row ' + rowId(row)" /></td>
                      @for (column of tableColumns(); track column.key) {
                        <td>{{ table.format(current.table, column.key, tableValue(row, column.key), row) }}</td>
                      }
                      <td class="row-actions">
                        <button type="button" (click)="openDetails(row)">View</button>
                        <button type="button" (click)="openEdit(row)">Edit</button>
                        <button type="button" class="danger-link" (click)="deleteRow(row)">Delete</button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td [attr.colspan]="tableColumns().length + 2" class="empty-row">No records found.</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <footer class="pagination">
              <span>{{ total() }} record(s)</span>
              <div>
                <button type="button" [disabled]="page() <= 1" (click)="changePage(page() - 1)">Previous</button>
                <span>Page {{ page() }} of {{ totalPages() }}</span>
                <button type="button" [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Next</button>
              </div>
            </footer>
          }
        </section>
      } @else {
        <section class="empty-state"><h2>Unknown entity</h2><p>No metadata is registered for this route.</p></section>
      }
    </div>

    @if (dialogOpen()) {
      <div class="dialog-backdrop" role="presentation" (click)="closeDialog()">
        <section class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="dialogTitle()" (click)="$event.stopPropagation()">
          <header><div><p>{{ entity()?.label }}</p><h2>{{ dialogTitle() }}</h2></div><button type="button" (click)="closeDialog()" aria-label="Close">×</button></header>
          @if (detailsRow()) {
            <div class="details-grid">
              @for (field of formFields(); track field.key) {
                <div><span>{{ field.label }}</span><strong>{{ table.format(entity()?.table, field.key, tableValue(detailsRow()!, field.key), detailsRow()!) }}</strong></div>
              }
            </div>
          } @else if (form(); as formGroup) {
            <form [formGroup]="formGroup" (ngSubmit)="save()">
              <div class="form-grid" [class.two-column]="(entity()?.form?.columns ?? 1) === 2">
                @for (field of formFields(); track field.key) {
                  @if (!field.hidden) {
                    <label>
                      <span>{{ field.label }} @if (field.required) { * }</span>
                      @switch (field.type ?? 'text') {
                        @case ('textarea') { <textarea [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" [attr.disabled]="field.readonly ? true : null"></textarea> }
                        @case ('select') {
                          <select [formControlName]="field.key">
                            <option value="">Select {{ field.label }}</option>
                            @for (option of field.options ?? []; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
                          </select>
                        }
                        @case ('boolean') { <input type="checkbox" [formControlName]="field.key" /> }
                        @case ('lookup') {
                          <select [formControlName]="field.key">
                            <option value="">Select {{ field.label }}</option>
                            @for (option of lookupOptions[field.key] ?? []; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
                          </select>
                        }
                        @default { <input [type]="field.type ?? 'text'" [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
                      }
                      @if (formEngine.isInvalid(formGroup, field.key)) { <small class="field-error">Please enter a valid {{ field.label }}.</small> }
                    </label>
                  }
                }
              </div>
              <footer><button type="button" class="secondary-button" (click)="closeDialog()">Cancel</button><button type="submit" class="action-button" [disabled]="formGroup.invalid">{{ entity()?.form?.submitLabel ?? 'Save' }}</button></footer>
            </form>
          }
        </section>
      </div>
    }
  `,
  styleUrl: './dynamic-management.scss',
})
export class DynamicManagementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(EntityMetadataRegistry);
  private readonly crud = inject(CrudEngine);
  readonly formEngine = inject(DynamicFormEngine);
  readonly table = inject(DynamicTableEngine);
  private readonly filters = inject(DynamicFilterEngine);
  readonly lookup = inject(LookupEngine);
  lookupOptions: Record<string, LookupOption[]> = {};

  readonly entity = signal<EntityMetadata | undefined>(undefined);
  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly searchTerm = signal('');
  readonly sortBy = signal('');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly selectedIds = signal<Array<string | number>>([]);
  readonly dialogOpen = signal(false);
  readonly dialogTitle = signal('Add record');
  readonly detailsRow = signal<Record<string, unknown> | undefined>(undefined);
  readonly editingRow = signal<Record<string, unknown> | undefined>(undefined);
  readonly form = signal<FormGroup | undefined>(undefined);
  readonly tableColumns = signal<Array<{ key: string; label: string; sortable?: boolean; width?: number }>>([]);
  readonly formFields = signal<FieldMetadata[]>([]);
  filterValues: Record<string, unknown> = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const key = params.get('entity') ?? '';
      const metadata = this.registry.get(key);
      this.entity.set(metadata);
      if (metadata) {
        this.limit.set(metadata.table?.pageSize ?? 10);
        this.tableColumns.set(this.table.getColumns(metadata.table));
        this.formFields.set((metadata.form?.fields ?? metadata.fields).filter((field) => field.inForm !== false));
        this.filterValues = {};
        this.load();
      }
    });
  }

  load(): void {
    const metadata = this.entity();
    if (!metadata) return;
    this.loading.set(true);
    this.error.set('');
    this.crud.list<Record<string, unknown>>(metadata, {
      page: this.page(),
      limit: this.limit(),
      search: this.searchTerm(),
      sortBy: this.sortBy() || undefined,
      sortDirection: this.sortDirection(),
      filters: this.filters.serialize(metadata.filters ?? [], this.filterValues),
    }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.total.set(result.pagination.total);
        this.totalPages.set(result.pagination.totalPages);
        this.page.set(result.pagination.page);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.error.set(error.message ?? 'Unable to load records.');
        this.loading.set(false);
      },
    });
  }

  search(): void { this.page.set(1); this.load(); }
  applyFilters(): void { this.page.set(1); this.load(); }
  changePage(page: number): void { this.page.set(page); this.load(); }
  sort(key: string): void {
    if (this.sortBy() === key) this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    else { this.sortBy.set(key); this.sortDirection.set('asc'); }
    this.load();
  }

  rowId(row: Record<string, unknown>): string | number {
    const metadata = this.entity();
    const id = row[metadata?.idKey ?? 'id'];
    return typeof id === 'string' || typeof id === 'number' ? id : '';
  }

  tableValue(row: Record<string, unknown>, key: string): unknown { return this.table.getValue(row, key); }

  toggleRow(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    this.selectedIds.set(this.selectedIds().includes(id)
      ? this.selectedIds().filter((selected) => selected !== id)
      : [...this.selectedIds(), id]);
  }

  allSelected(): boolean { return this.rows().length > 0 && this.rows().every((row) => this.selectedIds().includes(this.rowId(row))); }

  toggleAll(): void {
    this.selectedIds.set(this.allSelected() ? [] : this.rows().map((row) => this.rowId(row)));
  }

  openCreate(): void {
    const metadata = this.entity();
    if (!metadata) return;
    this.detailsRow.set(undefined);
    this.editingRow.set(undefined);
    this.form.set(this.formEngine.build(metadata.form?.fields ?? metadata.fields));
    this.loadLookupOptions(metadata.form?.fields ?? metadata.fields);
    this.dialogTitle.set(`Create ${metadata.label}`);
    this.dialogOpen.set(true);
  }

  openEdit(row: Record<string, unknown>): void {
    const metadata = this.entity();
    if (!metadata) return;
    this.detailsRow.set(undefined);
    this.editingRow.set(row);
    this.form.set(this.formEngine.build(metadata.form?.fields ?? metadata.fields, row));
    this.loadLookupOptions(metadata.form?.fields ?? metadata.fields);
    this.dialogTitle.set(`Edit ${metadata.label}`);
    this.dialogOpen.set(true);
  }

  openDetails(row: Record<string, unknown>): void {
    this.detailsRow.set(row);
    this.editingRow.set(undefined);
    this.form.set(undefined);
    this.dialogTitle.set(`${this.entity()?.label ?? 'Record'} details`);
    this.dialogOpen.set(true);
  }

  closeDialog(): void { this.dialogOpen.set(false); this.detailsRow.set(undefined); this.editingRow.set(undefined); this.form.set(undefined); }

  private loadLookupOptions(fields: FieldMetadata[]): void {
    this.lookupOptions = {};
    for (const field of fields) {
      if (field.lookup) {
        this.lookup.search(field.lookup).subscribe((options) => {
          this.lookupOptions[field.key] = options;
        });
      }
    }
  }

  save(): void {
    const metadata = this.entity();
    const form = this.form();
    if (!metadata || !form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }
    const title = this.dialogTitle();
    const body = form.getRawValue();
    if (title.startsWith('Edit')) {
      const row = this.editingRow();
      const id = row ? this.rowId(row) : '';
      if (id === '') return;
      this.crud.update(metadata, id, body).subscribe({ next: () => { this.closeDialog(); this.load(); }, error: (error: ApiError) => this.error.set(error.message) });
    } else {
      this.crud.create(metadata, body).subscribe({ next: () => { this.closeDialog(); this.load(); }, error: (error: ApiError) => this.error.set(error.message) });
    }
  }

  deleteRow(row: Record<string, unknown>): void {
    const metadata = this.entity();
    if (!metadata || !window.confirm('Delete this record?')) return;
    this.crud.delete(metadata, this.rowId(row)).subscribe({ next: () => this.load(), error: (error: ApiError) => this.error.set(error.message) });
  }

  bulkDelete(): void {
    const metadata = this.entity();
    if (!metadata || !this.selectedIds().length || !window.confirm(`Delete ${this.selectedIds().length} selected record(s)?`)) return;
    this.crud.bulkDelete(metadata, this.selectedIds()).subscribe({
      next: () => { this.selectedIds.set([]); this.load(); },
      error: (error: ApiError) => this.error.set(error.message),
    });
  }

  importFile(event: Event): void {
    const metadata = this.entity();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!metadata || !file) return;
    this.loading.set(true);
    this.crud.import(metadata, file).subscribe({
      next: () => { input.value = ''; this.load(); },
      error: (error: ApiError) => { input.value = ''; this.error.set(error.message); this.loading.set(false); },
    });
  }

  exportRows(): void {
    const metadata = this.entity();
    if (metadata) this.crud.export(metadata, this.rows(), 'csv');
  }
}
