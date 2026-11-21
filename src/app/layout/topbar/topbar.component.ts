import { Component, inject, output, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Component({
  selector: 'app-topbar',
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-button" type="button" aria-label="Toggle sidebar" (click)="toggleSidebar.emit()">☰</button>
        <div class="breadcrumbs"><span>Workspace</span><b>›</b><strong>{{ title() }}</strong></div>
      </div>
      <div class="topbar-actions">
        <select aria-label="School" (change)="selectSchool($event)" [value]="context.schoolId() ?? ''">
          <option value="">All schools</option>
          <option value="demo-school">Demo School</option>
        </select>
        <select aria-label="Branch" (change)="context.setBranch(selectValue($event))" [value]="context.branchId() ?? ''">
          <option value="">All branches</option>
          <option value="main">Main Branch</option>
        </select>
        <button class="icon-button" type="button" aria-label="Theme" (click)="toggleTheme()">◐</button>
        <button class="icon-button notification" type="button" aria-label="Notifications">♧<span>3</span></button>
        <button class="profile" type="button" (click)="profileOpen.set(!profileOpen())">
          <div class="avatar">{{ initials() }}</div>
          <div class="profile-copy"><strong>{{ auth.user()?.name ?? 'Administrator' }}</strong><span>Admin</span></div>
          <span>⌄</span>
        </button>
        @if (profileOpen()) {
          <div class="profile-menu">
            <button type="button">Profile</button>
            <button type="button">Change password</button>
            <button type="button" (click)="auth.logout()">Sign out</button>
          </div>
        }
      </div>
    </header>
  `,
  styleUrl: './topbar.scss',
})
export class TopbarComponent {
  readonly toggleSidebar = output<void>();
  readonly title = signal('Dashboard');
  readonly profileOpen = signal(false);
  readonly auth = inject(AuthService);
  readonly context = inject(TenantContextService);

  initials(): string {
    const name = this.auth.user()?.name ?? 'Administrator';
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  selectSchool(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.context.setSchool(select.value || null);
  }

  selectValue(event: Event): string | null {
    const select = event.target as HTMLSelectElement;
    return select.value || null;
  }

  toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('erp.theme', isDark ? 'dark' : 'light');
  }
}
