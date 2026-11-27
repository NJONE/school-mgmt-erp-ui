import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { combineLatest, map, switchMap } from 'rxjs';
import { ApiError } from '../core/models/api.models';
import { AuthService } from '../core/auth/auth.service';
import { AuthApiService } from '../core/auth/auth-api.service';
import { CreateUserRequest } from '../core/models/auth.models';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { EntityMetadataRegistry } from '../core/metadata/entity-registry.service';
import { DynamicFormEngine } from '../core/metadata/dynamic-form.service';
import { DynamicTableEngine } from '../core/metadata/dynamic-table.service';
import { DynamicFilterEngine } from '../core/metadata/dynamic-filter.service';
import { LookupEngine } from '../core/metadata/lookup.service';
import { EntityMetadata, FieldMetadata, FilterMetadata, LookupOption } from '../core/metadata/metadata.models';
import { CrudEngine } from '../core/crud/crud-engine.service';
import { ApiClientService } from '../core/services/api-client.service';
import { DomainWorkflowService, FeePaymentRequest, NotificationSendRequest, StudentPromotionRequest } from '../core/services/domain-workflow.service';
import { PermissionService } from '../core/permissions/permission.service';
import { TenantContextService } from '../core/tenant/tenant-context.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog.component';
import { FeedbackStateComponent, StatusBadgeComponent } from '../shared/components/feedback-state.component';

@Component({
  selector: 'app-dynamic-management',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ConfirmationDialogComponent,
    FeedbackStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a routerLink="/dashboard">Workspace</a><span aria-hidden="true">/</span>
        <span>Management</span><span aria-hidden="true">/</span>
        <strong>{{ entity()?.pluralLabel ?? 'Records' }}</strong>
      </nav>
      <header class="page-header">
        <div>
          <p>Management</p>
          <h1>{{ entity()?.pluralLabel ?? 'Records' }}</h1>
          <span class="page-description">Search, review, and manage {{ entity()?.pluralLabel?.toLowerCase() ?? 'records' }} in your current workspace.</span>
        </div>
        <div class="header-actions">
          @if (canImport()) {
            <button type="button" class="secondary-button" (click)="fileInput.click()" [disabled]="loading()">Import</button>
            <input #fileInput class="file-input" type="file" accept=".csv,.json" (change)="importFile($event)" />
          }
          @if (canExport()) {
            <button type="button" class="secondary-button" (click)="exportRows('csv')" [disabled]="!rows().length">Export CSV</button>
            <button type="button" class="secondary-button" (click)="exportRows('json')" [disabled]="!rows().length">Export JSON</button>
          }
          @if (canCreate()) { <button type="button" class="action-button" (click)="openCreate()">＋ Add {{ entity()?.label }}</button> }
        </div>
      </header>

      @if (success()) { <div class="success-alert" role="status">{{ success() }}</div> }

      @if (entity(); as current) {
        <section class="toolbar">
          @if (current.table?.searchable) {
            <label class="search-wrap">
              <span aria-hidden="true">⌕</span>
              <input class="search" type="search" [(ngModel)]="searchTerm" (ngModelChange)="search()" [placeholder]="'Search ' + current.pluralLabel" [attr.aria-label]="'Search ' + current.pluralLabel" />
            </label>
          }
          @for (filter of current.filters ?? []; track filter.key) {
            @if (filter.type === 'select') {
              <select [(ngModel)]="filterValues[filter.key]" (ngModelChange)="applyFilters()" [attr.aria-label]="filter.label" [disabled]="filterLookupLoading()[filter.key]">
                <option value="">All {{ filter.label }}</option>
                @if (filterLookupLoading()[filter.key]) { <option disabled>Loading options…</option> }
                @for (option of filter.options ?? []; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
                @for (option of filterLookupOptions()[filter.key] ?? []; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
              @if (filterLookupErrors()[filter.key]) { <small class="field-error" role="alert">{{ filterLookupErrors()[filter.key] }}</small> }
            } @else if (filter.type === 'boolean') {
              <select [(ngModel)]="filterValues[filter.key]" (ngModelChange)="applyFilters()" [attr.aria-label]="filter.label">
                <option value="">All {{ filter.label }}</option>
                <option [ngValue]="true">Yes</option>
                <option [ngValue]="false">No</option>
              </select>
            } @else {
              <input [(ngModel)]="filterValues[filter.key]" (ngModelChange)="applyFilters()" [type]="filter.type === 'date' ? 'date' : filter.type === 'range' ? 'number' : 'text'" [placeholder]="filter.label" />
            }
          }
          @if (current.filters?.length) {
            <button type="button" class="text-action" (click)="clearFilters()">Clear filters</button>
          }
          @if (tableColumns().length) {
            <div class="column-chooser">
              <button type="button" class="text-action" [attr.aria-expanded]="columnMenuOpen()" (click)="toggleColumnMenu()">Columns</button>
              @if (columnMenuOpen()) {
                <div class="column-menu" role="group" aria-label="Visible table columns">
                  @for (column of tableColumns(); track column.key) {
                    <label><input type="checkbox" [checked]="visibleColumnKeys().includes(column.key)" (change)="toggleColumn(column.key)" />{{ column.label }}</label>
                  }
                </div>
              }
            </div>
          }
          @if (selectedIds().length) {
            @if (canDelete()) { <button type="button" class="danger-button" (click)="bulkDelete()">Delete selected ({{ selectedIds().length }})</button> }
          }
        </section>

        <section class="table-card">
          @if (loading()) {
            <app-feedback-state kind="loading" [title]="'Loading ' + current.pluralLabel.toLowerCase()" message="Getting the latest records from the service." />
          } @else if (error() && !rows().length) {
            <app-feedback-state kind="error" title="Could not load records" [message]="error()" actionLabel="Try again" (action)="load()" />
          } @else if (!rows().length) {
            <app-feedback-state kind="empty" title="No records found" [message]="searchTerm() || hasFilters() ? 'Try adjusting your search or filters.' : 'There are no records to show yet.'" [actionLabel]="canCreate() ? 'Add ' + current.label : ''" (action)="openCreate()" />
          } @else {
            @if (error()) { <div class="inline-error" role="alert">{{ error() }}</div> }
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    @if (canDelete()) {
                      <th class="checkbox-column"><input type="checkbox" [checked]="allSelected()" (change)="toggleAll()" aria-label="Select all rows" /></th>
                    }
                    @for (column of visibleColumns(); track column.key) {
                      <th [style.width.px]="column.width ?? null">
                        <button type="button" [disabled]="!column.sortable" [attr.aria-label]="column.sortable ? 'Sort by ' + column.label : null" (click)="sort(column.key)">
                          {{ column.label }} @if (sortBy() === column.key) { <span aria-hidden="true">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span> }
                        </button>
                      </th>
                    }
                    @if (canUpdate() || canDelete() || canView() || canPromote() || canPublish() || canProcessPayroll()) { <th class="actions-column">Actions</th> }
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track rowId(row)) {
                    <tr>
                      @if (canDelete()) {
                        <td><input type="checkbox" [checked]="selectedIds().includes(rowId(row))" (change)="toggleRow(row)" [attr.aria-label]="'Select row ' + rowId(row)" /></td>
                      }
                      @for (column of visibleColumns(); track column.key) {
                        <td>
                          @if (column.key === 'status') {
                            <app-status-badge [value]="table.format(current.table, column.key, tableValue(row, column.key), row)" />
                          } @else {
                            {{ table.format(current.table, column.key, tableValue(row, column.key), row) }}
                          }
                        </td>
                      }
                      @if (canUpdate() || canDelete() || canView() || canPromote() || canPublish() || canProcessPayroll()) {
                        <td class="row-actions">
                          @if (canView()) { <button type="button" (click)="openDetails(row)">View</button> }
                          @if (canUpdate()) { <button type="button" (click)="openEdit(row)">Edit</button> }
                          @if (canPromote()) { <button type="button" (click)="openPromotion(row)">Promote</button> }
                          @if (canPublish()) { <button type="button" (click)="requestWorkflowConfirmation('publish', row)">Publish results</button> }
                          @if (canProcessPayroll()) { <button type="button" (click)="requestWorkflowConfirmation('process-payroll', row)">Process run</button> }
                          @if (canDelete()) { <button type="button" class="danger-link" (click)="deleteRow(row)">Delete</button> }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <footer class="pagination">
              <div class="pagination-summary"><strong>{{ total() }}</strong> records <span>·</span> Rows per page
                <select aria-label="Rows per page" [value]="limit()" (change)="changeLimit($event)">
                  <option [value]="10">10</option><option [value]="20">20</option><option [value]="25">25</option><option [value]="50">50</option><option [value]="100">100</option>
                </select>
              </div>
              <div class="pagination-controls">
                <button type="button" [disabled]="page() <= 1" (click)="changePage(page() - 1)">Previous</button>
                <span>Page {{ page() }} of {{ totalPages() }}</span>
                <button type="button" [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Next</button>
              </div>
            </footer>
          }
        </section>
      } @else {
        <section class="table-card"><app-feedback-state kind="error" title="Feature unavailable" [message]="error()" /></section>
      }
    </div>

    <app-confirmation-dialog
      [open]="confirmationOpen()"
      [title]="confirmationTitle()"
      [message]="confirmationMessage()"
      [confirmLabel]="confirmationConfirmLabel()"
      [danger]="confirmationDanger()"
      (cancel)="cancelDelete()"
      (confirm)="confirmAction()"
    />

    @if (dialogOpen()) {
      <div class="dialog-backdrop" role="presentation" (click)="closeDialog()">
        <section class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="dialogTitle()" (click)="$event.stopPropagation()">
          <header><div><p>{{ entity()?.label }}</p><h2>{{ dialogTitle() }}</h2></div><button type="button" (click)="closeDialog()" aria-label="Close">×</button></header>
          @if (formSections().length > 1) {
            <nav class="form-tabs" role="tablist" [attr.aria-label]="entity()?.label + ' form sections'">
              @for (section of formSections(); track section) {
                <button type="button" role="tab" [attr.aria-selected]="activeFormSection() === section" [class.active]="activeFormSection() === section" (click)="selectFormSection(section)">{{ section }}</button>
              }
            </nav>
          }
          @if (detailsRow()) {
            <div class="details-grid" role="tabpanel">
              @for (field of visibleFormFields(); track field.key) {
                <div><span>{{ field.label }}</span><strong>{{ table.format(entity()?.table, field.key, tableValue(detailsRow()!, field.key), detailsRow()!) }}</strong></div>
              }
            </div>
          } @else if (form(); as formGroup) {
            <form [formGroup]="formGroup" (ngSubmit)="save()">
              <div class="form-grid" [class.two-column]="(entity()?.form?.columns ?? 1) === 2" role="tabpanel">
                @for (field of visibleFormFields(); track field.key) {
                  <label>
                    <span>{{ field.label }} @if (field.required) { * }</span>
                    @switch (field.type ?? 'text') {
                      @case ('textarea') { <textarea [formControlName]="field.key" [placeholder]="field.placeholder ?? ''"></textarea> }
                      @case ('select') {
                        <select [formControlName]="field.key">
                          <option value="">Select {{ field.label }}</option>
                          @for (option of field.options ?? []; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
                        </select>
                      }
                      @case ('multiselect') {
                        <select multiple [formControlName]="field.key" [disabled]="lookupLoading()[field.key]">
                          @if (lookupLoading()[field.key]) { <option disabled>Loading options…</option> }
                          @for (option of field.options ?? []; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
                          @for (option of lookupOptions[field.key] ?? []; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
                        </select>
                      }
                      @case ('boolean') { <input type="checkbox" [formControlName]="field.key" /> }
                      @case ('time') { <input type="time" [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
                      @case ('datetime') { <input type="datetime-local" [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
                      @case ('lookup') {
                        <select [formControlName]="field.key" [disabled]="lookupLoading()[field.key]">
                          <option value="">Select {{ field.label }}</option>
                          @if (lookupLoading()[field.key]) { <option disabled>Loading options…</option> }
                          @for (option of lookupOptions[field.key] ?? []; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
                        </select>
                      }
                      @default { <input [type]="field.type ?? 'text'" [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
                    }
                    @if (field.type === 'lookup' && lookupErrors()[field.key]) { <small class="field-error" role="alert">{{ lookupErrors()[field.key] }}</small> }
                    @if (formEngine.isInvalid(formGroup, field.key)) { <small class="field-error">Please enter a valid {{ field.label }}.</small> }
                  </label>
                }
              </div>
              @if (error()) { <div class="inline-error form-error" role="alert">{{ error() }}</div> }
              <footer><button type="button" class="secondary-button" (click)="closeDialog()">Cancel</button><button type="submit" class="action-button" [disabled]="saving()">{{ saving() ? 'Saving…' : entity()?.form?.submitLabel ?? 'Save' }}</button></footer>
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
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly workflows = inject(DomainWorkflowService);
  private readonly registry = inject(EntityMetadataRegistry);
  private readonly crud = inject(CrudEngine);
  readonly formEngine = inject(DynamicFormEngine);
  readonly table = inject(DynamicTableEngine);
  private readonly filters = inject(DynamicFilterEngine);
  readonly lookup = inject(LookupEngine);
  private readonly permissions = inject(PermissionService);
  private readonly context = inject(TenantContextService);
  lookupOptions: Record<string, LookupOption[]> = {};

  readonly entity = signal<EntityMetadata | undefined>(undefined);
  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly success = signal('');
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
  readonly confirmationOpen = signal(false);
  readonly confirmationTitle = signal('Delete record?');
  readonly confirmationMessage = signal('This action cannot be undone.');
  readonly confirmationConfirmLabel = signal('Delete');
  readonly confirmationDanger = signal(true);
  readonly dialogTitle = signal('Add record');
  readonly detailsRow = signal<Record<string, unknown> | undefined>(undefined);
  readonly editingRow = signal<Record<string, unknown> | undefined>(undefined);
  readonly form = signal<FormGroup | undefined>(undefined);
  readonly tableColumns = signal<Array<{ key: string; label: string; sortable?: boolean; width?: number }>>([]);
  readonly visibleColumnKeys = signal<string[]>([]);
  readonly columnMenuOpen = signal(false);
  readonly formFields = signal<FieldMetadata[]>([]);
  readonly formSections = signal<string[]>([]);
  readonly activeFormSection = signal('');
  readonly lookupLoading = signal<Record<string, boolean>>({});
  readonly lookupErrors = signal<Record<string, string>>({});
  readonly filterLookupOptions = signal<Record<string, LookupOption[]>>({});
  readonly filterLookupLoading = signal<Record<string, boolean>>({});
  readonly filterLookupErrors = signal<Record<string, string>>({});
  readonly workflowMode = signal<'promotion' | undefined>(undefined);
  filterValues: Record<string, unknown> = {};
  private readonly destroyRef = inject(DestroyRef);
  private pendingDeleteRow: Record<string, unknown> | undefined;
  private pendingWorkflowRow: Record<string, unknown> | undefined;
  private pendingWorkflowAction: 'publish' | 'process-payroll' | undefined;
  private promotionStudentRow: Record<string, unknown> | undefined;
  private pendingBulkDelete = false;
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  private lastContextRevision = this.context.revision();

  constructor() {
    effect(() => {
      const revision = this.context.revision();
      if (revision !== this.lastContextRevision) {
        this.lastContextRevision = revision;
        if (this.entity()) {
          this.page.set(1);
          this.load();
        }
      }
    });
    this.destroyRef.onDestroy(() => {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
    });
  }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([params, queryParams]) => this.registry.loadFromBackend(this.api).pipe(
          map(() => [params, queryParams] as const),
        )),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ([params, queryParams]) => {
      const key = params.get('entity') ?? '';
      const metadata = this.registry.get(key);
      this.entity.set(metadata);
      this.page.set(1);
      this.searchTerm.set(queryParams.get('search') ?? '');
      this.sortBy.set('');
      this.selectedIds.set([]);
      this.success.set('');
      this.error.set(metadata ? '' : `No feature is configured for "${key}".`);
      if (metadata) {
        this.limit.set(metadata.table?.pageSize ?? 10);
        this.tableColumns.set(this.table.getColumns(metadata.table));
        this.visibleColumnKeys.set(this.table.getColumns(metadata.table).map((column) => column.key));
        this.columnMenuOpen.set(false);
        this.setFormFields((metadata.form?.fields ?? metadata.fields).filter((field) => field.inForm !== false));
        this.loadFilterLookups(metadata.filters ?? []);
        this.filterValues = {};
        this.rows.set([]);
        this.load();
      } else {
        this.rows.set([]);
      }
        },
        error: (error: ApiError) => {
          this.entity.set(undefined);
          this.rows.set([]);
          this.loading.set(false);
          this.error.set(error.message ?? 'Unable to load entity configuration from the service.');
        },
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
        this.selectedIds.set([]);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.error.set(error.message ?? 'Unable to load records.');
        this.loading.set(false);
      },
    });
  }

  search(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 300);
  }

  applyFilters(): void { this.page.set(1); this.load(); }
  clearFilters(): void {
    this.filterValues = {};
    this.page.set(1);
    this.load();
  }
  hasFilters(): boolean {
    return Object.values(this.filterValues).some((value) => value !== '' && value !== null && value !== undefined);
  }
  changePage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
    this.load();
  }
  changeLimit(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const limit = Number(target.value);
    if (![10, 25, 50].includes(limit)) return;
    this.limit.set(limit);
    this.page.set(1);
    this.load();
  }
  sort(key: string): void {
    if (this.sortBy() === key) this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    else { this.sortBy.set(key); this.sortDirection.set('asc'); }
    this.load();
  }

  canCreate(): boolean {
    const permission = this.entity()?.permissions?.create;
    return !!permission && this.permissions.has(permission);
  }

  canUpdate(): boolean {
    const permission = this.entity()?.permissions?.update;
    return !!permission && this.permissions.has(permission);
  }

  canDelete(): boolean {
    const permission = this.entity()?.permissions?.delete;
    return !!permission && this.permissions.has(permission);
  }

  canView(): boolean {
    const permission = this.entity()?.permissions?.list;
    return !!permission && this.permissions.has(permission);
  }

  canPromote(): boolean {
    return this.entity()?.apiEntityCode === 'students' && this.permissions.has('students.update');
  }

  canPublish(): boolean {
    return this.entity()?.apiEntityCode === 'examinations' && this.permissions.has('results.publish');
  }

  canProcessPayroll(): boolean {
    return this.entity()?.apiEntityCode === 'payrollRuns' && this.permissions.has('payrollRuns.update');
  }

  canImport(): boolean {
    return false;
  }

  canExport(): boolean {
    const permission = this.entity()?.permissions?.export;
    return !!permission && this.permissions.has(permission);
  }

  rowId(row: Record<string, unknown>): string | number {
    const metadata = this.entity();
    const id = row[metadata?.idKey ?? 'id'];
    return typeof id === 'string' || typeof id === 'number' ? id : '';
  }

  tableValue(row: Record<string, unknown>, key: string): unknown { return this.table.getValue(row, key); }

  visibleFormFields(): FieldMetadata[] {
    const section = this.activeFormSection();
    return this.formFields().filter((field) => (field.section ?? 'General') === section && !field.hidden);
  }

  visibleColumns(): Array<{ key: string; label: string; sortable?: boolean; width?: number }> {
    const visible = new Set(this.visibleColumnKeys());
    return this.tableColumns().filter((column) => visible.has(column.key));
  }

  toggleColumn(key: string): void {
    const selected = this.visibleColumnKeys();
    if (selected.includes(key)) {
      if (selected.length > 1) this.visibleColumnKeys.set(selected.filter((column) => column !== key));
    } else {
      this.visibleColumnKeys.set([...selected, key]);
    }
  }

  toggleColumnMenu(): void {
    this.columnMenuOpen.update((open) => !open);
  }

  selectFormSection(section: string): void {
    this.activeFormSection.set(section);
  }

  private showFirstInvalidSection(form: FormGroup): void {
    const firstInvalid = this.formFields().find((field) => form.get(field.key)?.invalid);
    if (firstInvalid) this.activeFormSection.set(firstInvalid.section ?? 'General');
  }

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
    if (!metadata || !this.canCreate()) return;
    const fields = this.createFormFields(metadata);
    this.setFormFields(fields);
    this.detailsRow.set(undefined);
    this.editingRow.set(undefined);
    this.workflowMode.set(undefined);
    this.promotionStudentRow = undefined;
    this.error.set('');
    this.form.set(this.formEngine.build(fields));
    this.selectFirstFormSection();
    this.loadLookupOptions(fields);
    this.dialogTitle.set(`Create ${metadata.label}`);
    this.dialogOpen.set(true);
  }

  openEdit(row: Record<string, unknown>): void {
    const metadata = this.entity();
    if (!metadata || !this.canUpdate()) return;
    const fields = (metadata.form?.fields ?? metadata.fields).filter((field) => field.inForm !== false);
    this.setFormFields(fields);
    this.detailsRow.set(undefined);
    this.editingRow.set(row);
    this.workflowMode.set(undefined);
    this.promotionStudentRow = undefined;
    this.error.set('');
    this.form.set(this.formEngine.build(fields, row));
    this.selectFirstFormSection();
    this.loadLookupOptions(fields);
    this.dialogTitle.set(`Edit ${metadata.label}`);
    this.dialogOpen.set(true);
  }

  openDetails(row: Record<string, unknown>): void {
    if (!this.canView()) return;
    const fields = (this.entity()?.form?.fields ?? this.entity()?.fields ?? []).filter((field) => field.inForm !== false);
    this.setFormFields(fields);
    this.detailsRow.set(row);
    this.editingRow.set(undefined);
    this.workflowMode.set(undefined);
    this.promotionStudentRow = undefined;
    this.form.set(undefined);
    this.selectFirstFormSection();
    this.dialogTitle.set(`${this.entity()?.label ?? 'Record'} details`);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    if (this.saving()) return;
    this.dialogOpen.set(false);
    this.detailsRow.set(undefined);
    this.editingRow.set(undefined);
    this.form.set(undefined);
    this.workflowMode.set(undefined);
    this.promotionStudentRow = undefined;
    const metadata = this.entity();
    if (metadata) this.setFormFields((metadata.form?.fields ?? metadata.fields).filter((field) => field.inForm !== false));
  }

  openPromotion(row: Record<string, unknown>): void {
    if (!this.canPromote()) return;
    const fields: FieldMetadata[] = [
      { key: 'classId', label: 'Target class', type: 'lookup', required: true, inForm: true, section: 'Promotion', lookup: { endpoint: API_ENDPOINTS.classes, labelField: 'name', valueField: 'id' } },
      { key: 'sectionId', label: 'Target section', type: 'lookup', required: true, inForm: true, section: 'Promotion', lookup: { endpoint: API_ENDPOINTS.sections, labelField: 'name', valueField: 'id' } },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', required: true, inForm: true, section: 'Promotion', lookup: { endpoint: API_ENDPOINTS.academicSessions, labelField: 'name', valueField: 'id' } },
    ];
    this.setFormFields(fields);
    this.workflowMode.set('promotion');
    this.promotionStudentRow = row;
    this.detailsRow.set(undefined);
    this.editingRow.set(undefined);
    this.error.set('');
    this.form.set(this.formEngine.build(fields));
    this.loadLookupOptions(fields);
    this.dialogTitle.set('Promote student');
    this.dialogOpen.set(true);
  }

  private loadLookupOptions(fields: FieldMetadata[]): void {
    this.lookupOptions = {};
    this.lookupLoading.set({});
    this.lookupErrors.set({});
    for (const field of fields) {
      if (field.lookup) {
        this.lookupLoading.update((loading) => ({ ...loading, [field.key]: true }));
        this.lookup.search(field.lookup).subscribe((options) => {
          this.lookupOptions = { ...this.lookupOptions, [field.key]: options };
          this.lookupLoading.update((loading) => ({ ...loading, [field.key]: false }));
        }, (error: ApiError) => {
          this.lookupErrors.update((errors) => ({ ...errors, [field.key]: error.message ?? 'Unable to load options.' }));
          this.lookupLoading.update((loading) => ({ ...loading, [field.key]: false }));
        });
      }
    }
  }

  private loadFilterLookups(filters: FilterMetadata[]): void {
    this.filterLookupOptions.set({});
    this.filterLookupLoading.set({});
    this.filterLookupErrors.set({});
    for (const filter of filters) {
      if (!filter.lookup) continue;
      this.filterLookupLoading.update((loading) => ({ ...loading, [filter.key]: true }));
      this.lookup.search(filter.lookup).subscribe({
        next: (options) => {
          this.filterLookupOptions.update((current) => ({ ...current, [filter.key]: options }));
          this.filterLookupLoading.update((loading) => ({ ...loading, [filter.key]: false }));
        },
        error: (error: ApiError) => {
          this.filterLookupErrors.update((errors) => ({ ...errors, [filter.key]: error.message ?? 'Unable to load filter options.' }));
          this.filterLookupLoading.update((loading) => ({ ...loading, [filter.key]: false }));
        },
      });
    }
  }

  private setFormFields(fields: FieldMetadata[]): void {
    this.formFields.set(fields);
    this.formSections.set(Array.from(new Set(fields.map((field) => field.section ?? 'General'))));
    this.selectFirstFormSection();
  }

  private createFormFields(metadata: EntityMetadata): FieldMetadata[] {
    const fields = (metadata.form?.fields ?? metadata.fields)
      .filter((field) => field.inForm !== false && !field.hidden);
    if (metadata.apiEntityCode !== 'users') return fields;

    const accountFields: FieldMetadata[] = [
      ...fields,
      {
        key: 'password', label: 'Initial password', type: 'password', required: true,
        minLength: 12, maxLength: 128, inForm: true, section: 'Account',
      },
    ];
    if (!this.auth.user()?.isPlatformAdmin) return accountFields;

    const platformScopeFields: FieldMetadata[] = [
      { key: 'tenantId', label: 'Tenant', type: 'lookup', inForm: true, section: 'Scope', lookup: { endpoint: `${API_ENDPOINTS.entities}/tenants`, labelField: 'name', valueField: 'id' } },
      { key: 'schoolId', label: 'School', type: 'lookup', inForm: true, section: 'Scope', lookup: { endpoint: `${API_ENDPOINTS.entities}/schools`, labelField: 'name', valueField: 'id' } },
      { key: 'branchId', label: 'Branch', type: 'lookup', inForm: true, section: 'Scope', lookup: { endpoint: `${API_ENDPOINTS.entities}/branches`, labelField: 'name', valueField: 'id' } },
      { key: 'academicSessionId', label: 'Academic session', type: 'lookup', inForm: true, section: 'Scope', lookup: { endpoint: `${API_ENDPOINTS.entities}/academicSessions`, labelField: 'name', valueField: 'id' } },
      { key: 'isPlatformAdmin', label: 'Platform administrator', type: 'boolean', defaultValue: false, inForm: true, section: 'Scope' },
    ];
    return [...accountFields, ...platformScopeFields];
  }

  private selectFirstFormSection(): void {
    this.activeFormSection.set(this.formSections()[0] ?? 'General');
  }

  save(): void {
    const metadata = this.entity();
    const form = this.form();
    if (!metadata || !form || this.saving()) {
      form?.markAllAsTouched();
      return;
    }
    if (form.invalid) {
      form.markAllAsTouched();
      this.showFirstInvalidSection(form);
      return;
    }
    const promoting = this.workflowMode() === 'promotion';
    if (promoting ? !this.canPromote() : this.editingRow() ? !this.canUpdate() : !this.canCreate()) return;
    const body = form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    if (promoting) {
      const studentId = this.promotionStudentRow ? this.rowId(this.promotionStudentRow) : '';
      if (studentId === '') {
        this.saving.set(false);
        this.error.set('The student cannot be promoted because the record has no ID.');
        return;
      }
      const request: StudentPromotionRequest = {
        studentId: String(studentId),
        classId: String(body['classId'] ?? ''),
        sectionId: String(body['sectionId'] ?? ''),
        academicSessionId: String(body['academicSessionId'] ?? ''),
      };
      this.workflows.promoteStudent(request).subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Student promoted successfully.');
          this.closeDialog();
          this.load();
        },
        error: (error: ApiError) => { this.saving.set(false); this.error.set(error.message); },
      });
      return;
    }
    if (this.editingRow()) {
      const row = this.editingRow();
      const id = row ? this.rowId(row) : '';
      if (id === '') {
        this.saving.set(false);
        this.error.set('The record cannot be updated because it has no ID.');
        return;
      }
      this.crud.update(metadata, id, body).subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set(`${metadata.label} updated successfully.`);
          this.closeDialog();
          this.load();
        },
        error: (error: ApiError) => {
          this.saving.set(false);
          this.error.set(error.message);
        },
      });
    } else {
      this.createRecord(metadata, body).subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set(`${metadata.label} created successfully.`);
          this.closeDialog();
          this.load();
        },
        error: (error: ApiError) => {
          this.saving.set(false);
          this.error.set(error.message);
        },
      });
    }
  }

  private createRecord(metadata: EntityMetadata, body: Record<string, unknown>) {
    if (metadata.apiEntityCode === 'users') return this.authApi.createUser(this.toCreateUserRequest(body));
    if (metadata.apiEntityCode === 'feePayments') {
      const request: FeePaymentRequest = {
        studentId: String(body['studentId'] ?? ''),
        amount: Number(body['amount']),
        paymentDate: this.toIsoDateTime(body['paymentDate']),
        paymentMethod: String(body['paymentMethod'] ?? '') as FeePaymentRequest['paymentMethod'],
        ...(typeof body['referenceNumber'] === 'string' ? { referenceNumber: body['referenceNumber'] } : {}),
      };
      return this.workflows.recordFeePayment(request);
    }
    if (metadata.apiEntityCode === 'notifications') {
      const request: NotificationSendRequest = {
        recipientId: String(body['recipientId'] ?? ''),
        channel: String(body['channel'] ?? '') as NotificationSendRequest['channel'],
        ...(typeof body['subject'] === 'string' ? { subject: body['subject'] } : {}),
        body: String(body['body'] ?? ''),
      };
      return this.workflows.sendNotification(request);
    }
    if (metadata.apiEntityCode === 'documentGenerationJobs') {
      return this.workflows.generateDocument({
        templateId: String(body['templateId'] ?? ''),
        documentType: String(body['documentType'] ?? ''),
      });
    }
    return this.crud.create(metadata, body);
  }

  private toCreateUserRequest(body: Record<string, unknown>): CreateUserRequest {
    const request: CreateUserRequest = {
      email: String(body['email'] ?? ''),
      displayName: String(body['displayName'] ?? ''),
      password: String(body['password'] ?? ''),
    };
    if (Array.isArray(body['roleKeys'])) request.roleKeys = body['roleKeys'].filter((value): value is string => typeof value === 'string');
    if (this.auth.user()?.isPlatformAdmin) {
      for (const key of ['tenantId', 'schoolId', 'branchId', 'academicSessionId'] as const) {
        if (typeof body[key] === 'string' && body[key]) request[key] = body[key] as string;
      }
      if (typeof body['isPlatformAdmin'] === 'boolean') request.isPlatformAdmin = body['isPlatformAdmin'];
    }
    return request;
  }

  private toIsoDateTime(value: unknown): string {
    const date = new Date(String(value ?? ''));
    return Number.isNaN(date.getTime()) ? String(value ?? '') : date.toISOString();
  }

  deleteRow(row: Record<string, unknown>): void {
    if (!this.canDelete()) return;
    this.pendingDeleteRow = row;
    this.pendingBulkDelete = false;
    this.pendingWorkflowAction = undefined;
    this.confirmationConfirmLabel.set('Delete');
    this.confirmationDanger.set(true);
    this.confirmationTitle.set(`Delete ${this.entity()?.label.toLowerCase() ?? 'record'}?`);
    this.confirmationMessage.set('This record will be soft-deleted by the service.');
    this.confirmationOpen.set(true);
  }

  bulkDelete(): void {
    if (!this.canDelete() || !this.selectedIds().length) return;
    this.pendingDeleteRow = undefined;
    this.pendingBulkDelete = true;
    this.pendingWorkflowAction = undefined;
    this.confirmationConfirmLabel.set('Delete');
    this.confirmationDanger.set(true);
    this.confirmationTitle.set(`Delete ${this.selectedIds().length} records?`);
    this.confirmationMessage.set('This action cannot be undone.');
    this.confirmationOpen.set(true);
  }

  cancelDelete(): void {
    this.confirmationOpen.set(false);
    this.pendingDeleteRow = undefined;
    this.pendingBulkDelete = false;
    this.pendingWorkflowAction = undefined;
    this.pendingWorkflowRow = undefined;
  }

  requestWorkflowConfirmation(action: 'publish' | 'process-payroll', row: Record<string, unknown>): void {
    if (action === 'publish' && !this.canPublish()) return;
    if (action === 'process-payroll' && !this.canProcessPayroll()) return;
    this.pendingDeleteRow = undefined;
    this.pendingBulkDelete = false;
    this.pendingWorkflowAction = action;
    this.pendingWorkflowRow = row;
    this.confirmationDanger.set(false);
    this.confirmationConfirmLabel.set(action === 'publish' ? 'Publish results' : 'Process run');
    this.confirmationTitle.set(action === 'publish' ? 'Publish examination results?' : 'Process payroll run?');
    this.confirmationMessage.set(action === 'publish'
      ? 'The service will publish this examination and its results.'
      : 'The service will process this payroll run.');
    this.confirmationOpen.set(true);
  }

  confirmAction(): void {
    if (this.pendingWorkflowAction) {
      this.confirmWorkflowAction();
      return;
    }
    this.confirmDelete();
  }

  private confirmWorkflowAction(): void {
    const action = this.pendingWorkflowAction;
    const row = this.pendingWorkflowRow;
    this.confirmationOpen.set(false);
    this.pendingWorkflowAction = undefined;
    this.pendingWorkflowRow = undefined;
    if (!action || !row) return;
    const id = this.rowId(row);
    if (id === '') {
      this.error.set('The selected record cannot be processed because it has no ID.');
      return;
    }
    const operation = action === 'publish'
      ? this.workflows.publishExamination(String(id))
      : this.workflows.processPayrollRun(String(id));
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(action === 'publish' ? 'Examination results published.' : 'Payroll run processed.');
        this.load();
      },
      error: (error: ApiError) => { this.saving.set(false); this.error.set(error.message); },
    });
  }

  confirmDelete(): void {
    const metadata = this.entity();
    if (!metadata || !this.canDelete()) return;
    this.confirmationOpen.set(false);
    if (this.pendingBulkDelete) {
      this.crud.bulkDelete(metadata, this.selectedIds()).subscribe({
        next: (result) => {
          this.selectedIds.set([]);
          this.success.set(`${result.succeeded} record(s) deleted${result.failed ? `; ${result.failed} could not be deleted` : ''}.`);
          this.load();
        },
        error: (error: ApiError) => this.error.set(error.message),
      });
      this.pendingBulkDelete = false;
      return;
    }
    const row = this.pendingDeleteRow;
    this.pendingDeleteRow = undefined;
    if (!row) return;
    const id = this.rowId(row);
    if (id === '') {
      this.error.set('The record cannot be deleted because it has no ID.');
      return;
    }
    this.crud.delete(metadata, id).subscribe({
      next: () => {
        this.success.set(`${metadata.label} deleted successfully.`);
        this.load();
      },
      error: (error: ApiError) => this.error.set(error.message),
    });
  }

  importFile(event: Event): void {
    const metadata = this.entity();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!metadata || !file || !this.canImport()) return;
    this.loading.set(true);
    this.error.set('');
    this.crud.import(metadata, file).subscribe({
      next: () => { input.value = ''; this.success.set(`${metadata.pluralLabel} imported successfully.`); this.load(); },
      error: (error: ApiError) => { input.value = ''; this.error.set(error.message); this.loading.set(false); },
    });
  }

  exportRows(format: 'csv' | 'json'): void {
    const metadata = this.entity();
    if (!metadata || !this.canExport()) return;
    this.crud.export(metadata, this.rows(), format);
  }
}
