import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CrudEngine } from '../../core/crud/crud-engine.service';
import { EntityMetadataRegistry } from '../../core/metadata/entity-registry.service';

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div><p>Monday, 21 November</p><h1>Good morning, Administrator</h1></div>
        <button type="button" class="action-button" (click)="refresh()">↻ Refresh</button>
      </header>
      @if (loading()) {
        <div class="loading-grid" aria-label="Loading dashboard"><span></span><span></span><span></span><span></span></div>
      } @else {
        <section class="stats">
          @for (card of cards(); track card.label) {
            <article class="stat-card">
              <div class="stat-icon" [style.--tone]="card.tone">{{ card.icon }}</div>
              <div><span>{{ card.label }}</span><strong>{{ card.value }}</strong><small>{{ card.change }}</small></div>
            </article>
          }
        </section>
        <section class="dashboard-grid">
          <article class="panel attendance-panel">
            <div class="panel-header"><div><h2>Attendance overview</h2><p>Student attendance this week</p></div><select aria-label="Attendance period"><option>This week</option></select></div>
            <div class="chart-placeholder"><span>{{ attendanceSummary() }}</span><p>Records from the attendance endpoint</p></div>
          </article>
          <article class="panel">
            <div class="panel-header"><div><h2>Quick actions</h2><p>Frequently used tasks</p></div></div>
            <div class="quick-actions">
              <a routerLink="/management/students"><span>＋</span><b>Add student</b></a>
              <a routerLink="/management/attendance"><span>✓</span><b>Mark attendance</b></a>
              <a routerLink="/management/fee-collections"><span>₹</span><b>Collect fee</b></a>
              <a routerLink="/management/reports"><span>↗</span><b>Generate report</b></a>
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
  readonly attendanceSummary = signal('Loading attendance');
  private readonly crud = inject(CrudEngine);
  private readonly registry = inject(EntityMetadataRegistry);
  readonly cards = signal<StatCard[]>([
    { label: 'Total students', value: '—', change: 'Current student records', icon: '◎', tone: '#3b82f6' },
    { label: 'Active staff', value: '—', change: 'Current staff records', icon: '♧', tone: '#8b5cf6' },
    { label: 'Today’s attendance', value: '—', change: 'Attendance records', icon: '✓', tone: '#10b981' },
    { label: 'Fee collection', value: '—', change: 'Fee collection records', icon: '₹', tone: '#f59e0b' },
  ]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    const students = this.registry.get('students');
    const staff = this.registry.get('staff');
    const attendance = this.registry.get('attendance');
    const feeCollections = this.registry.get('fee-collections');
    if (!students || !staff || !attendance || !feeCollections) {
      this.loading.set(false);
      return;
    }
    forkJoin({
      students: this.crud.list<Record<string, unknown>>(students, { page: 1, limit: 1 }),
      staff: this.crud.list<Record<string, unknown>>(staff, { page: 1, limit: 1 }),
      attendance: this.crud.list<Record<string, unknown>>(attendance, { page: 1, limit: 100 }),
      fees: this.crud.list<Record<string, unknown>>(feeCollections, { page: 1, limit: 100 }),
    }).subscribe({
      next: (result) => {
        const present = result.attendance.items.filter((row) => String(row['status'] ?? '').toLowerCase() === 'present').length;
        const feeTotal = result.fees.items.reduce((sum, row) => {
          const amount = Number(row['amount']);
          return Number.isFinite(amount) ? sum + amount : sum;
        }, 0);
        this.cards.set([
          { label: 'Total students', value: String(result.students.pagination.total), change: 'Current student records', icon: '◎', tone: '#3b82f6' },
          { label: 'Active staff', value: String(result.staff.pagination.total), change: 'Current staff records', icon: '♧', tone: '#8b5cf6' },
          { label: 'Today’s attendance', value: `${present}/${result.attendance.pagination.total}`, change: 'Present in loaded records', icon: '✓', tone: '#10b981' },
          { label: 'Fee collection', value: feeTotal.toLocaleString(), change: 'Loaded collection amount', icon: '₹', tone: '#f59e0b' },
        ]);
        this.attendanceSummary.set(`${present} present`);
        this.loading.set(false);
      },
      error: () => {
        this.attendanceSummary.set('Attendance unavailable');
        this.loading.set(false);
      },
    });
  }
}
