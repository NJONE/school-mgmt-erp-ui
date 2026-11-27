import { Component, OnInit, DestroyRef, input, output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { PermissionService } from '../../core/permissions/permission.service';
import { EntityMetadataRegistry } from '../../core/metadata/entity-registry.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { AuthService } from '../../core/auth/auth.service';

interface NavLink {
  label: string;
  icon: string;
  route: string;
  permission?: string;
}

interface NavGroup {
  label: string;
  icon: string;
  children: NavLink[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <a class="brand" routerLink="/dashboard" aria-label="EduCore dashboard" (click)="closeMobile.emit()">
        <span class="brand-mark">E</span>
        @if (!collapsed()) {
          <span class="brand-copy"><strong>EduCore</strong><small>School ERP</small></span>
        }
      </a>
      <nav aria-label="Main navigation">
        <a
          class="dashboard-link"
          routerLink="/dashboard"
          routerLinkActive="active"
          [title]="collapsed() ? 'Dashboard' : null"
          (click)="closeMobile.emit()"
        >
          <span class="nav-icon">▦</span>
          @if (!collapsed()) { <span>Dashboard</span> }
        </a>
        @for (group of visibleGroups(); track group.label) {
          <section class="nav-group">
            @if (!collapsed()) {
              <button
                class="group-toggle"
                type="button"
                [attr.aria-expanded]="isExpanded(group.label)"
                (click)="toggleGroup(group.label)"
              >
                <span class="group-label"><span aria-hidden="true">{{ group.icon }}</span>{{ group.label }}</span>
                <span class="chevron" aria-hidden="true">{{ isExpanded(group.label) ? '⌄' : '›' }}</span>
              </button>
            }
            @if (collapsed() || isExpanded(group.label)) {
              @for (item of group.children; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [title]="collapsed() ? item.label : null"
                  (click)="closeMobile.emit()"
                >
                  <span class="nav-icon">{{ item.icon }}</span>
                  @if (!collapsed()) { <span>{{ item.label }}</span> }
                </a>
              }
            }
          </section>
        }
        <a
          class="settings-link"
          routerLink="/settings"
          routerLinkActive="active"
          [title]="collapsed() ? 'Preferences' : null"
          (click)="closeMobile.emit()"
        >
          <span class="nav-icon">⚙</span>
          @if (!collapsed()) { <span>Preferences</span> }
        </a>
      </nav>
      @if (!collapsed()) {
        <footer class="sidebar-footer">
          <span class="online-dot"></span>
          <span>School operations</span>
        </footer>
      }
    </aside>
  `,
  styleUrl: './sidebar.scss',
})
export class SidebarComponent implements OnInit {
  readonly collapsed = input(false);
  readonly closeMobile = output<void>();
  private readonly permissions = inject(PermissionService);
  private readonly registry = inject(EntityMetadataRegistry);
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly expandedGroups = signal<Set<string>>(new Set());

  readonly groups: NavGroup[] = [
    {
      label: 'School management',
      icon: '⌂',
      children: [
        { label: 'Schools', icon: '⌂', route: '/management/schools', permission: 'schools.view' },
        { label: 'Branches', icon: '◇', route: '/management/branches', permission: 'branches.view' },
        { label: 'Academic sessions', icon: '◷', route: '/management/academic-sessions', permission: 'academic-sessions.view' },
      ],
    },
    {
      label: 'People',
      icon: '◎',
      children: [
        { label: 'Students', icon: '◎', route: '/management/students', permission: 'students.view' },
        { label: 'Parents & guardians', icon: '♙', route: '/management/parents', permission: 'parents.view' },
        { label: 'Staff', icon: '♧', route: '/management/staff', permission: 'staff.view' },
        { label: 'Users', icon: 'U', route: '/management/users', permission: 'users.view' },
        { label: 'Roles', icon: 'R', route: '/management/roles', permission: 'roles.view' },
        { label: 'Permissions', icon: 'P', route: '/management/permissions', permission: 'permissions.view' },
      ],
    },
    {
      label: 'Academics',
      icon: 'A',
      children: [
        { label: 'Classes', icon: 'C', route: '/management/classes', permission: 'classes.view' },
        { label: 'Sections', icon: 'S', route: '/management/sections', permission: 'sections.view' },
        { label: 'Subjects', icon: 'J', route: '/management/subjects', permission: 'subjects.view' },
        { label: 'Teacher assignments', icon: 'T', route: '/management/teacher-assignments', permission: 'teacher-assignments.view' },
        { label: 'Timetables', icon: '◷', route: '/management/timetables', permission: 'timetables.view' },
      ],
    },
    {
      label: 'Attendance',
      icon: '✓',
      children: [
        { label: 'Student attendance', icon: '✓', route: '/management/attendance', permission: 'attendance.view' },
        { label: 'Capture attendance', icon: '+', route: '/attendance/capture', permission: 'studentAttendance.create' },
      ],
    },
    {
      label: 'Examinations',
      icon: '✎',
      children: [
        { label: 'Examinations', icon: 'E', route: '/management/examinations', permission: 'examinations.view' },
        { label: 'Marks', icon: 'M', route: '/management/marks', permission: 'marks.view' },
        { label: 'Grades', icon: 'G', route: '/management/grades', permission: 'grades.view' },
        { label: 'Results', icon: 'R', route: '/management/results', permission: 'results.view' },
        { label: 'Report cards', icon: 'C', route: '/management/report-cards', permission: 'report-cards.view' },
      ],
    },
    {
      label: 'Fees & finance',
      icon: '$',
      children: [
        { label: 'Fee categories', icon: 'F', route: '/management/fee-categories', permission: 'fee-categories.view' },
        { label: 'Fee structures', icon: 'F', route: '/management/fee-structures', permission: 'fee-structures.view' },
        { label: 'Student fees', icon: 'F', route: '/management/student-fees', permission: 'student-fees.view' },
        { label: 'Installments', icon: 'I', route: '/management/installments', permission: 'installments.view' },
        { label: 'Fee collection', icon: '$', route: '/management/fee-collections', permission: 'fee-collections.view' },
        { label: 'Receipts', icon: 'R', route: '/management/receipts', permission: 'receipts.view' },
        { label: 'Discounts', icon: 'D', route: '/management/discounts', permission: 'discounts.view' },
        { label: 'Scholarships', icon: 'S', route: '/management/scholarships', permission: 'scholarships.view' },
        { label: 'Expenses', icon: '−', route: '/management/expenses', permission: 'expenses.view' },
        { label: 'Accounts', icon: 'A', route: '/management/accounts', permission: 'accounts.view' },
      ],
    },
    {
      label: 'Operations',
      icon: '◈',
      children: [
        { label: 'HR & leave', icon: 'H', route: '/management/hr', permission: 'hr.view' },
        { label: 'Payroll', icon: 'P', route: '/management/payroll', permission: 'payroll.view' },
        { label: 'Library', icon: '▤', route: '/management/library', permission: 'library.view' },
        { label: 'Transport', icon: 'T', route: '/management/transport', permission: 'transport.view' },
        { label: 'Inventory', icon: 'I', route: '/management/inventory', permission: 'inventory.view' },
        { label: 'Assets', icon: 'A', route: '/management/assets', permission: 'assets.view' },
        { label: 'Communication', icon: '◉', route: '/management/communication', permission: 'communication.view' },
        { label: 'Documents', icon: 'D', route: '/management/documents', permission: 'documents.view' },
        { label: 'Reports', icon: '≡', route: '/management/reports', permission: 'reports.view' },
      ],
    },
    {
      label: 'SaaS administration',
      icon: '◉',
      children: [
        { label: 'Tenants', icon: 'T', route: '/management/tenants', permission: 'tenants.view' },
        { label: 'Subscription plans', icon: 'P', route: '/management/subscription-plans', permission: 'subscription-plans.view' },
        { label: 'Subscriptions', icon: 'S', route: '/management/subscriptions', permission: 'subscriptions.view' },
        { label: 'Billing', icon: 'B', route: '/management/billing', permission: 'billing.view' },
        { label: 'Usage', icon: 'U', route: '/management/usage', permission: 'usage.view' },
        { label: 'Platform configuration', icon: '⚙', route: '/management/platform-configuration', permission: 'platform-configuration.view' },
      ],
    },
  ];

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.expandActiveGroup());
    this.registry.loadFromBackend(this.api)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.expandActiveGroup(), error: () => this.expandActiveGroup() });
    this.expandActiveGroup();
  }

  visibleGroups(): NavGroup[] {
    if (this.registry.hasBackendCatalog()) {
      const byModule = new Map<string, NavLink[]>();
      for (const entity of this.registry.all()) {
        const permission = entity.permissions?.list;
        if (!permission || !this.permissions.has(permission)) continue;
        if (['platform', 'subscriptions', 'tenants'].includes(entity.module ?? '') && !this.auth.user()?.isPlatformAdmin) continue;
        const module = entity.module ?? 'management';
        const links = byModule.get(module) ?? [];
        links.push({
          label: entity.pluralLabel,
          icon: moduleIcon(module),
          route: `/management/${entity.key}`,
          permission,
        });
        byModule.set(module, links);
      }
      if (this.permissions.has('studentAttendance.create')) {
        const attendanceLinks = byModule.get('attendance') ?? [];
        attendanceLinks.push({
          label: 'Capture attendance',
          icon: '+',
          route: '/attendance/capture',
          permission: 'studentAttendance.create',
        });
        byModule.set('attendance', attendanceLinks);
      }
      return Array.from(byModule.entries())
        .map(([module, children]) => ({
          label: moduleLabel(module),
          icon: moduleIcon(module),
          children: children.sort((left, right) => left.label.localeCompare(right.label)),
        }))
        .sort((left, right) => left.label.localeCompare(right.label));
    }
    return this.groups
      .map((group) => ({
        ...group,
        children: group.children.filter((item) => !item.permission || this.permissions.has(item.permission)),
      }))
      .filter((group) => group.children.length > 0);
  }

  isExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  toggleGroup(label: string): void {
    this.expandedGroups.update((groups) => {
      const next = new Set(groups);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  private expandActiveGroup(): void {
    const activeGroup = this.visibleGroups().find((group) =>
      group.children.some((item) => this.router.url.startsWith(item.route)),
    );
    if (activeGroup) this.expandedGroups.update((groups) => new Set([...groups, activeGroup.label]));
  }
}

function moduleLabel(module: string): string {
  return module.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moduleIcon(module: string): string {
  const icons: Record<string, string> = {
    academics: 'A', attendance: '✓', examinations: 'E', fees: '$', finance: 'F',
    payroll: 'P', leave: 'L', library: '▤', transport: 'T', inventory: 'I',
    assets: 'A', communications: '◉', documents: 'D', reports: '≡',
    subscriptions: 'S', tenants: 'T', platform: '⚙', security: '◈', schools: '⌂',
    students: '◎', parents: '♙', staff: '♧', system: '⚙',
  };
  return icons[module] ?? '•';
}
