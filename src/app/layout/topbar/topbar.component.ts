import { Component, OnInit, WritableSignal, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { PaginatedData } from '../../core/models/api.models';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-button" type="button" aria-label="Toggle sidebar" (click)="toggleSidebar.emit()">☰</button>
        <div class="breadcrumbs"><span>Workspace</span><b>›</b><strong>{{ title() }}</strong></div>
      </div>
      <div class="topbar-actions">
        <select aria-label="School" (change)="selectSchool($event)" [value]="context.schoolId() ?? ''">
          <option value="">All schools</option>
          @for (school of context.schools(); track school.id) { <option [value]="school.id">{{ school.name }}</option> }
        </select>
        <select aria-label="Branch" (change)="context.setBranch(selectValue($event))" [value]="context.branchId() ?? ''">
          <option value="">All branches</option>
          @for (branch of context.branches(); track branch.id) { <option [value]="branch.id">{{ branch.name }}</option> }
        </select>
        <select aria-label="Academic session" (change)="context.setAcademicSession(selectValue($event))" [value]="context.academicSessionId() ?? ''">
          <option value="">All sessions</option>
          @for (session of context.academicSessions(); track session.id) { <option [value]="session.id">{{ session.name }}</option> }
        </select>
        <button class="icon-button" type="button" aria-label="Theme" (click)="toggleTheme()">◐</button>
        <a class="icon-button notification" routerLink="/management/communication" aria-label="Notifications">♧</a>
        <button class="profile" type="button" (click)="profileOpen.set(!profileOpen())">
          <div class="avatar">{{ initials() }}</div>
          <div class="profile-copy"><strong>{{ auth.user()?.name ?? 'Administrator' }}</strong><span>Admin</span></div>
          <span>⌄</span>
        </button>
        @if (profileOpen()) {
          <div class="profile-menu">
            <a routerLink="/management/users">Profile</a>
            <a routerLink="/management/platform-configuration">Settings</a>
            <button type="button" (click)="auth.logout()">Sign out</button>
          </div>
        }
      </div>
    </header>
  `,
  styleUrl: './topbar.scss',
})
export class TopbarComponent implements OnInit {
  readonly toggleSidebar = output<void>();
  readonly title = signal('Dashboard');
  readonly profileOpen = signal(false);
  readonly auth = inject(AuthService);
  readonly context = inject(TenantContextService);
  private readonly api = inject(ApiClientService);

  ngOnInit(): void {
    this.loadOptions(API_ENDPOINTS.schools, this.context.schools);
    this.loadOptions(API_ENDPOINTS.academicSessions, this.context.academicSessions);
    if (this.context.schoolId()) this.loadOptions(API_ENDPOINTS.branches, this.context.branches);
  }

  initials(): string {
    const name = this.auth.user()?.name ?? 'Administrator';
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  selectValue(event: Event): string | null {
    const select = event.target as HTMLSelectElement;
    return select.value || null;
  }

  toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('erp.theme', isDark ? 'dark' : 'light');
  }

  selectSchool(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const schoolId = select.value || null;
    this.context.setSchool(schoolId);
    this.context.branches.set([]);
    if (schoolId) this.loadOptions(API_ENDPOINTS.branches, this.context.branches);
  }

  private loadOptions(
    endpoint: string,
    target: WritableSignal<{ id: string; name: string }[]>,
  ): void {
    this.api.get<PaginatedData<Record<string, unknown>> | Record<string, unknown>[]>(endpoint, { limit: 100 }).subscribe({
      next: (response) => {
        const data = response.data;
        const rows = Array.isArray(data)
          ? data
          : typeof data === 'object' && data !== null && 'items' in data
            ? (data as PaginatedData<Record<string, unknown>>).items
            : [];
        target.set(rows.map((row) => ({
          id: String(row['id'] ?? ''),
          name: String(row['name'] ?? row['title'] ?? row['label'] ?? 'Unnamed'),
        })).filter((option) => option.id));
      },
      error: () => target.set([]),
    });
  }
}
