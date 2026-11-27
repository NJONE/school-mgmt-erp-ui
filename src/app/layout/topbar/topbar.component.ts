import { Component, DestroyRef, OnInit, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, forkJoin, map, of, Subject, switchMap } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { AuthService } from '../../core/auth/auth.service';
import { CrudEngine } from '../../core/crud/crud-engine.service';
import { EntityMetadataRegistry } from '../../core/metadata/entity-registry.service';
import { EntityMetadata } from '../../core/metadata/metadata.models';
import { ApiError } from '../../core/models/api.models';
import { PermissionService } from '../../core/permissions/permission.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { ThemeService } from '../../core/services/theme.service';

interface SearchResult {
  entity: string;
  query: string;
  title: string;
  detail: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  unread: boolean;
}

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, FormsModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-button menu-button" type="button" aria-label="Toggle sidebar" (click)="toggleSidebar.emit()">☰</button>
        <div class="breadcrumbs"><span>Workspace</span><b aria-hidden="true">›</b><strong>{{ title() }}</strong></div>
      </div>
      <div class="topbar-actions">
        <div class="global-search">
          <label class="search-control">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              [(ngModel)]="searchTerm"
              (ngModelChange)="searchTerms.next($event)"
              (focus)="searchOpen.set(searchTerm.trim().length >= 2)"
              (keydown.escape)="closeSearch()"
              placeholder="Search students, staff, fees…"
              aria-label="Search students, parents, staff, classes, fees, and documents"
              autocomplete="off"
            />
            @if (searchTerm) {
              <button type="button" class="clear-search" aria-label="Clear search" (click)="clearSearch()">×</button>
            }
          </label>
          @if (searchOpen()) {
            <div class="search-results" role="listbox" aria-label="Search results">
              @if (searchLoading()) {
                <p class="panel-message">Searching records…</p>
              } @else if (searchError()) {
                <p class="panel-message error-message" role="alert">{{ searchError() }}</p>
              } @else if (searchResults().length) {
                @for (result of searchResults(); track result.entity + result.title) {
                  <a
                    class="search-result"
                    [routerLink]="'/management/' + result.entity"
                    [queryParams]="{ search: result.query }"
                    role="option"
                    (click)="closeSearch()"
                  >
                    <span class="result-icon" aria-hidden="true">{{ entityIcon(result.entity) }}</span>
                    <span><strong>{{ result.title }}</strong><small>{{ result.detail }}</small></span>
                  </a>
                }
              } @else {
                <p class="panel-message">Enter at least 2 characters to search records.</p>
              }
            </div>
          }
        </div>
        <div class="scope-summary" aria-label="Account data scope">
          <span>Scope</span><strong>{{ scopeSummary() }}</strong>
        </div>
        <button class="icon-button" type="button" [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'" (click)="toggleTheme()">
          {{ isDark() ? '☼' : '◐' }}
        </button>
        <div class="notification-wrap">
          <button class="icon-button notification-button" type="button" aria-label="Notifications" [attr.aria-expanded]="notificationsOpen()" (click)="toggleNotifications()">
            ♧
            @if (unreadCount()) { <span class="unread-dot" [attr.aria-label]="unreadCount() + ' unread notifications'"></span> }
          </button>
          @if (notificationsOpen()) {
            <section class="notification-panel" aria-label="Notifications">
              <header><strong>Notifications</strong><a routerLink="/management/communication" (click)="notificationsOpen.set(false)">View messages</a></header>
              @if (notificationLoading()) {
                <p class="panel-message">Loading notifications…</p>
              } @else if (notificationError()) {
                <p class="panel-message error-message" role="alert">{{ notificationError() }}</p>
              } @else if (notifications().length) {
                @for (notification of notifications(); track notification.id) {
                  <article class="notification-item" [class.unread]="notification.unread">
                    <span class="notification-dot" aria-hidden="true"></span>
                    <div><strong>{{ notification.title }}</strong><p>{{ notification.message }}</p><small>{{ notification.createdAt }}</small></div>
                  </article>
                }
              } @else {
                <p class="panel-message">You’re all caught up.</p>
              }
            </section>
          }
        </div>
        <div class="profile-wrap">
          <button class="profile" type="button" (click)="profileOpen.set(!profileOpen())" [attr.aria-expanded]="profileOpen()">
            <span class="avatar">{{ initials() }}</span>
            <span class="profile-copy"><strong>{{ auth.user()?.name ?? 'Account' }}</strong><small>{{ roleLabel() }}</small></span>
            <span aria-hidden="true">⌄</span>
          </button>
          @if (profileOpen()) {
            <div class="profile-menu">
              <a routerLink="/management/users" (click)="profileOpen.set(false)">My account</a>
              <a routerLink="/settings" (click)="profileOpen.set(false)">Preferences</a>
              <button type="button" (click)="signOut()">Sign out</button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styleUrl: './topbar.scss',
})
export class TopbarComponent implements OnInit {
  readonly toggleSidebar = output<void>();
  readonly title = signal('Dashboard');
  readonly profileOpen = signal(false);
  readonly searchOpen = signal(false);
  searchTerm = '';
  readonly searchResults = signal<SearchResult[]>([]);
  readonly searchLoading = signal(false);
  readonly searchError = signal('');
  readonly notificationsOpen = signal(false);
  readonly notifications = signal<NotificationItem[]>([]);
  readonly notificationLoading = signal(false);
  readonly notificationError = signal('');
  readonly theme = inject(ThemeService);
  readonly isDark = this.theme.isDark;
  readonly unreadCount = computed(() => this.notifications().filter((item) => item.unread).length);
  readonly searchTerms = new Subject<string>();
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly crud = inject(CrudEngine);
  private readonly registry = inject(EntityMetadataRegistry);
  private readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateTitle();
        this.closeSearch();
      });
    this.updateTitle();
    this.registry.loadFromBackend(this.api).subscribe({
      next: () => this.updateTitle(),
      error: () => undefined,
    });

    this.searchTerms.pipe(
      map((term) => term.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.searchRecords(term)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((results) => this.searchResults.set(results));

  }

  initials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  }

  roleLabel(): string {
    return this.auth.user()?.roles[0]?.replaceAll('_', ' ') ?? 'Member';
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  scopeSummary(): string {
    const user = this.auth.user();
    if (!user) return 'Account scoped';
    if (user.isPlatformAdmin) return 'Platform wide';
    const scopes = [user.tenantId && 'Tenant', user.schoolId && 'School', user.branchId && 'Branch', user.academicSessionId && 'Session']
      .filter((scope): scope is string => !!scope);
    return scopes.length ? scopes.join(' · ') : 'Account scoped';
  }

  entityIcon(key: string): string {
    return this.registry.get(key)?.label.slice(0, 1).toUpperCase() ?? '•';
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults.set([]);
    this.searchError.set('');
    this.searchOpen.set(false);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
    if (this.notificationsOpen() && !this.notifications().length && !this.notificationLoading()) {
      this.loadNotifications();
    }
  }

  signOut(): void {
    this.profileOpen.set(false);
    this.auth.logout();
  }

  private updateTitle(): void {
    const segments = this.router.url.split('?')[0].split('/').filter(Boolean);
    if (segments[0] === 'management' && segments[1]) {
      this.title.set(this.registry.get(segments[1])?.pluralLabel ?? 'Management');
      return;
    }
    this.title.set(segments[0] === 'settings' ? 'Preferences' : 'Dashboard');
  }

  private searchRecords(term: string) {
    this.searchError.set('');
    if (term.length < 2) {
      this.searchResults.set([]);
      this.searchLoading.set(false);
      return of([]);
    }
    const searchable = ['students', 'parents', 'staff', 'classes', 'fee-collections', 'documents']
      .map((key) => this.registry.get(key))
      .filter((entity): entity is EntityMetadata => {
        const permission = entity?.permissions?.list;
        return !!entity && !!permission && this.permissions.has(permission);
      });
    if (!searchable.length) {
      this.searchLoading.set(false);
      this.searchError.set('You do not have permission to search records.');
      return of([]);
    }
    this.searchOpen.set(true);
    this.searchLoading.set(true);
    return forkJoin(searchable.map((entity) =>
      this.crud.search<Record<string, unknown>>(entity, term, { page: 1, limit: 4 }).pipe(
        map((page) => page.items.map((row) => ({
          entity: entity.key,
          query: term,
          title: this.displayName(row),
          detail: `${entity.pluralLabel} · ${this.displayDetail(row)}`,
        }))),
      ),
    )).pipe(
      map((groups) => groups.flat()),
      catchError((error: ApiError) => {
        this.searchError.set(error.message ?? 'Search is unavailable.');
        return of([]);
      }),
      finalize(() => this.searchLoading.set(false)),
    );
  }

  private displayName(row: Record<string, unknown>): string {
    const name = [row['firstName'], row['middleName'], row['lastName']].filter(Boolean).join(' ');
    return String(row['name'] ?? row['title'] ?? (name || row['admissionNumber'] || row['id'] || 'Record'));
  }

  private displayDetail(row: Record<string, unknown>): string {
    return String(row['admissionNumber'] ?? row['employeeNumber'] ?? row['email'] ?? row['code'] ?? row['status'] ?? '');
  }

  private loadNotifications(): void {
    this.notificationLoading.set(true);
    this.notificationError.set('');
    this.api.get<unknown>(API_ENDPOINTS.notifications, { page: 1, pageSize: 8 }).pipe(
      map((response) => {
        const data = response.data;
        const rows: unknown[] | undefined = Array.isArray(data)
          ? data
          : typeof data === 'object' && data !== null && 'items' in data && Array.isArray(data['items'])
            ? data['items']
            : undefined;
        if (!rows) throw new Error('The service returned notifications in an unsupported format.');
        return rows.map((item) => {
          if (typeof item !== 'object' || item === null) {
            throw new Error('The service returned a notification in an unsupported format.');
          }
          const row = item as Record<string, unknown>;
          const id = row['id'];
          if (typeof id !== 'string' && typeof id !== 'number') {
            throw new Error('The service returned a notification without a valid ID.');
          }
          return {
            id: String(id),
            title: String(row['title'] ?? 'Notification'),
            message: String(row['message'] ?? row['body'] ?? ''),
            createdAt: String(row['createdAt'] ?? row['created_at'] ?? ''),
            unread: row['read'] === false || row['isRead'] === false || row['unread'] === true,
          };
        });
      }),
      finalize(() => this.notificationLoading.set(false)),
    ).subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: (error: ApiError) => {
        this.notificationError.set(error.message ?? 'Notifications could not be loaded.');
      },
    });
  }
}
