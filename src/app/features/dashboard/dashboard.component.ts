import { Component, signal } from '@angular/core';

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
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
            <div class="chart-placeholder"><span>Bar chart</span><p>Connect the dashboard attendance API to populate this view.</p></div>
          </article>
          <article class="panel">
            <div class="panel-header"><div><h2>Quick actions</h2><p>Frequently used tasks</p></div></div>
            <div class="quick-actions">
              <button type="button"><span>＋</span><b>Add student</b></button>
              <button type="button"><span>✓</span><b>Mark attendance</b></button>
              <button type="button"><span>₹</span><b>Collect fee</b></button>
              <button type="button"><span>↗</span><b>Generate report</b></button>
            </div>
          </article>
        </section>
      }
    </div>
  `,
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  readonly loading = signal(false);
  readonly cards = signal<StatCard[]>([
    { label: 'Total students', value: '—', change: 'Waiting for dashboard API', icon: '◎', tone: '#3b82f6' },
    { label: 'Active staff', value: '—', change: 'Waiting for dashboard API', icon: '♧', tone: '#8b5cf6' },
    { label: 'Today’s attendance', value: '—', change: 'Waiting for dashboard API', icon: '✓', tone: '#10b981' },
    { label: 'Fee collection', value: '—', change: 'Waiting for dashboard API', icon: '₹', tone: '#f59e0b' },
  ]);

  refresh(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 500);
  }
}
