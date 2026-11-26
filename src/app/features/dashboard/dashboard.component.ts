import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { CrudEngine } from '../../core/crud/crud-engine.service';
import { CrudPage } from '../../core/crud/crud.models';
import { EntityMetadataRegistry } from '../../core/metadata/entity-registry.service';
import { CrudQuery } from '../../core/metadata/metadata.models';
import { PermissionService } from '../../core/permissions/permission.service';
import { ApiError } from '../../core/models/api.models';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { FeedbackStateComponent } from '../../shared/components/feedback-state.component';

interface StatCard {
  label: string;
  value: string;
  note: string;
  icon: string;
  tone: string;
}

type DashboardPage = CrudPage<Record<string, unknown>> | null;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FeedbackStateComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p>{{ todayLabel() }}</p>
          <h1>{{ greeting() }}, {{ firstName() }}</h1>
          <span>Here’s what’s happening across your school workspace.</span>
        </div>
        <button type="button" class="refresh-button" (click)="refresh()" [disabled]="loading()">
          <span aria-hidden="true">↻</span> {{ loading() ? 'Refreshing…' : 'Refresh' }}
        </button>
      </header>

      @if (error()) {
        <div class="dashboard-error" role="status">
          <span>{{ error() }}</span>
          <button type="button" (click)="refresh()">Retry</button>
        </div>
      }

      @if (loading() && !hasLoaded()) {
        <div class="stat-grid" aria-label="Loading dashboard">
          @for (item of [1, 2, 3, 4]; track item) { <div class="skeleton-card"></div> }
        </div>
      } @else {
        <section class="stat-grid" aria-label="School overview">
          @for (card of cards(); track card.label) {
            <article class="stat-card">
              <span class="stat-icon" [style.--tone]="card.tone" aria-hidden="true">{{ card.icon }}</span>
              <div class="stat-copy">
                <span>{{ card.label }}</span>
                <strong>{{ card.value }}</strong>
                <small>{{ card.note }}</small>
              </div>
            </article>
          }
        </section>

        <section class="content-grid">
          <article class="panel admissions-panel">
            @if (canView('students')) {
              <header class="panel-heading">
                <div><h2>Recent admissions</h2><p>Latest student records from your school</p></div>
                <a routerLink="/management/students">View all <span aria-hidden="true">→</span></a>
              </header>
              @if (loading() && !recentStudents().length) {
                <app-feedback-state kind="loading" title="Loading admissions" [compact]="true" />
              } @else if (recentStudentsError()) {
                <app-feedback-state kind="error" title="Admissions unavailable" [message]="recentStudentsError()" actionLabel="Retry" [compact]="true" (action)="refresh()" />
              } @else if (!recentStudents().length) {
                <app-feedback-state kind="empty" title="No student records yet" message="New student records will appear here." [compact]="true" />
              } @else {
                <div class="admission-list">
                  @for (student of recentStudents(); track student['id'] ?? student['admissionNumber']) {
                    <a routerLink="/management/students" [queryParams]="{ search: studentName(student) }" class="admission-row">
                      <span class="student-avatar">{{ initials(studentName(student)) }}</span>
                      <span class="student-copy">
                        <strong>{{ studentName(student) }}</strong>
                        <small>{{ student['admissionNumber'] ?? 'Admission number unavailable' }} · {{ student['className'] ?? student['class'] ?? 'Class not assigned' }}</small>
                      </span>
                      <span class="admission-date">{{ formatDate(student['admissionDate'] ?? student['createdAt']) }}</span>
                    </a>
                  }
                </div>
              }
            } @else {
              <app-feedback-state kind="empty" title="Admissions restricted" message="Your role does not have permission to view student records." [compact]="true" />
            }
          </article>

          <article class="panel actions-panel">
            <header class="panel-heading">
              <div><h2>Quick actions</h2><p>Shortcuts to common workflows</p></div>
            </header>
            <div class="quick-actions">
              @if (canView('students') && canCreate('students')) { <a routerLink="/management/students" class="quick-action"><span class="action-icon blue">＋</span><span><strong>Add student</strong><small>Register a new student</small></span><b aria-hidden="true">→</b></a> }
              @if (canView('attendance')) { <a routerLink="/management/attendance" class="quick-action"><span class="action-icon green">✓</span><span><strong>Attendance</strong><small>Review daily attendance</small></span><b aria-hidden="true">→</b></a> }
              @if (canView('fee-collections')) { <a routerLink="/management/fee-collections" class="quick-action"><span class="action-icon amber">$</span><span><strong>Fee collection</strong><small>View payment records</small></span><b aria-hidden="true">→</b></a> }
              @if (canView('reports')) { <a routerLink="/management/reports" class="quick-action"><span class="action-icon violet">≡</span><span><strong>Reports</strong><small>Explore school reports</small></span><b aria-hidden="true">→</b></a> }
              @if (!hasQuickActions()) { <p class="no-actions">No quick actions are available for your permissions.</p> }
            </div>
          </article>
        </section>
      }
    </div>
  `,
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  readonly loading = signal(false);
  readonly hasLoaded = signal(false);
  readonly error = signal('');
  readonly recentStudentsError = signal('');
  readonly recentStudents = signal<Array<Record<string, unknown>>>([]);
  private readonly crud = inject(CrudEngine);
  private readonly registry = inject(EntityMetadataRegistry);
  private readonly permissions = inject(PermissionService);
  private readonly auth = inject(AuthService);
  private readonly context = inject(TenantContextService);
  private readonly failures = new Set<string>();
  private lastContextRevision = this.context.revision();

  constructor() {
    effect(() => {
      const revision = this.context.revision();
      if (revision !== this.lastContextRevision) {
        this.lastContextRevision = revision;
        this.refresh();
      }
    });
  }

  readonly cards = signal<StatCard[]>([
    { label: 'Total students', value: '—', note: 'Student records', icon: '◎', tone: '#3b82f6' },
    { label: 'Active staff', value: '—', note: 'Staff members', icon: '♧', tone: '#8b5cf6' },
    { label: 'Attendance today', value: '—', note: 'Attendance records', icon: '✓', tone: '#10b981' },
    { label: 'Fee payments today', value: '—', note: 'Payment records', icon: '$', tone: '#f59e0b' },
  ]);

  ngOnInit(): void {
    this.refresh();
  }

  todayLabel(): string {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  }

  greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }

  firstName(): string {
    return this.auth.user()?.name.split(/\s+/)[0] ?? 'there';
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.recentStudentsError.set('');
    this.failures.clear();
    const today = this.localDate();
    forkJoin({
      students: this.fetch('students', { page: 1, limit: 1 }),
      staff: this.fetch('staff', { page: 1, limit: 1, filters: { status: 'active' } }),
      attendance: this.fetch('attendance', { page: 1, limit: 1, filters: { date: today } }),
      fees: this.fetch('fee-collections', { page: 1, limit: 1, filters: { paymentDate: today } }),
      admissions: this.fetch('students', { page: 1, limit: 5, sortBy: 'createdAt', sortDirection: 'desc' }, 'student-admissions'),
    }).subscribe((result) => {
      this.cards.set([
        this.stat('Total students', result.students, 'students', 'Student records', '◎', '#3b82f6'),
        this.stat('Active staff', result.staff, 'staff', 'Active staff members', '♧', '#8b5cf6'),
        this.stat('Attendance today', result.attendance, 'attendance', 'Attendance records', '✓', '#10b981'),
        this.stat('Fee payments today', result.fees, 'fee-collections', 'Payment records', '$', '#f59e0b'),
      ]);
      this.recentStudents.set(result.admissions?.items ?? []);
      if (this.failures.size) this.error.set('Some dashboard information could not be loaded. Retry to try again.');
      this.hasLoaded.set(true);
      this.loading.set(false);
    });
  }

  canView(entity: string): boolean {
    const permission = this.registry.get(entity)?.permissions?.list;
    return !!permission && this.permissions.has(permission);
  }

  canCreate(entity: string): boolean {
    const permission = this.registry.get(entity)?.permissions?.create;
    return !!permission && this.permissions.has(permission);
  }

  hasQuickActions(): boolean {
    return (this.canView('students') && this.canCreate('students'))
      || ['attendance', 'fee-collections', 'reports'].some((key) => this.canView(key));
  }

  studentName(student: Record<string, unknown>): string {
    const name = [student['firstName'], student['middleName'], student['lastName']].filter(Boolean).join(' ');
    return String(student['name'] ?? (name || student['admissionNumber'] || 'Student'));
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S';
  }

  formatDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }

  private fetch(entityKey: string, query: CrudQuery, failureKey = entityKey): Observable<DashboardPage> {
    const entity = this.registry.get(entityKey);
    const permission = entity?.permissions?.list;
    if (!entity || !permission || !this.permissions.has(permission)) return of(null);
    return this.crud.list<Record<string, unknown>>(entity, query).pipe(
      catchError((error: ApiError) => {
        this.failures.add(failureKey);
        if (failureKey === 'student-admissions') this.recentStudentsError.set(error.message ?? 'Student records could not be loaded.');
        return of(null);
      }),
    );
  }

  private stat(
    label: string,
    result: DashboardPage,
    entityKey: string,
    note: string,
    icon: string,
    tone: string,
  ): StatCard {
    const entity = this.registry.get(entityKey);
    const permitted = !!entity?.permissions?.list && this.permissions.has(entity.permissions.list);
    return {
      label,
      value: result ? result.pagination.total.toLocaleString() : permitted ? '—' : 'Restricted',
      note: result ? note : permitted ? 'Service data unavailable' : 'Not available for your role',
      icon,
      tone,
    };
  }

  private localDate(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
