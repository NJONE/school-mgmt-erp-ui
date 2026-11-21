import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="brand">
        <div class="brand-mark">E</div>
        @if (!collapsed()) { <div><strong>EduCore</strong><span>School ERP</span></div> }
      </div>
      <nav>
        @for (item of items; track item.label) {
          @if (item.route) {
            <a [routerLink]="item.route" routerLinkActive="active" [title]="collapsed() ? item.label : null">
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) { <span>{{ item.label }}</span> }
            </a>
          } @else {
            <button type="button" [title]="collapsed() ? item.label : null">
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) { <span>{{ item.label }}</span><span class="chevron">›</span> }
            </button>
          }
        }
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly closeMobile = output<void>();

  readonly items: NavItem[] = [
    { label: 'Dashboard', icon: '▦', route: '/dashboard' },
    { label: 'Schools', icon: '⌂', route: '/management/schools' },
    { label: 'Branches', icon: '◇', route: '/management/branches' },
    { label: 'Academic', icon: 'A', route: '/management/academic-sessions' },
    { label: 'Classes', icon: 'C', route: '/management/classes' },
    { label: 'Sections', icon: 'S', route: '/management/sections' },
    { label: 'Subjects', icon: 'J', route: '/management/subjects' },
    { label: 'Students', icon: '◎', route: '/management/students' },
    { label: 'Parents', icon: '♙', route: '/management/parents' },
    { label: 'Staff', icon: '♧', route: '/management/staff' },
    { label: 'Users', icon: 'U', route: '/management/users' },
    { label: 'Roles', icon: 'R', route: '/management/roles' },
    { label: 'Permissions', icon: 'P', route: '/management/permissions' },
    { label: 'Teacher Assignments', icon: 'T', route: '/management/teacher-assignments' },
    { label: 'Timetable', icon: 'T', route: '/management/timetables' },
    { label: 'Attendance', icon: '✓', route: '/management/attendance' },
    { label: 'Examinations', icon: 'E', route: '/management/examinations' },
    { label: 'Marks', icon: 'M', route: '/management/marks' },
    { label: 'Grades', icon: 'G', route: '/management/grades' },
    { label: 'Results', icon: 'R', route: '/management/results' },
    { label: 'Report Cards', icon: 'C', route: '/management/report-cards' },
    { label: 'Fee Categories', icon: 'F', route: '/management/fee-categories' },
    { label: 'Fee Structures', icon: 'F', route: '/management/fee-structures' },
    { label: 'Student Fees', icon: 'F', route: '/management/student-fees' },
    { label: 'Installments', icon: 'I', route: '/management/installments' },
    { label: 'Fee Collection', icon: '₹', route: '/management/fee-collections' },
    { label: 'Receipts', icon: 'R', route: '/management/receipts' },
    { label: 'Discounts', icon: 'D', route: '/management/discounts' },
    { label: 'Scholarships', icon: 'S', route: '/management/scholarships' },
    { label: 'Expenses', icon: 'E', route: '/management/expenses' },
    { label: 'Accounts', icon: 'A', route: '/management/accounts' },
    { label: 'HR', icon: 'H', route: '/management/hr' },
    { label: 'Payroll', icon: 'P', route: '/management/payroll' },
    { label: 'Library', icon: '▤', route: '/management/library' },
    { label: 'Transport', icon: 'T', route: '/management/transport' },
    { label: 'Inventory', icon: 'I', route: '/management/inventory' },
    { label: 'Assets', icon: 'A', route: '/management/assets' },
    { label: 'Communication', icon: '◉', route: '/management/communication' },
    { label: 'Documents', icon: 'D', route: '/management/documents' },
    { label: 'Reports', icon: '≡', route: '/management/reports' },
    { label: 'Tenants', icon: 'T', route: '/management/tenants' },
    { label: 'Subscription Plans', icon: 'P', route: '/management/subscription-plans' },
    { label: 'Subscriptions', icon: 'S', route: '/management/subscriptions' },
    { label: 'Billing', icon: 'B', route: '/management/billing' },
    { label: 'Usage', icon: 'U', route: '/management/usage' },
    { label: 'Platform Configuration', icon: '⚙', route: '/management/platform-configuration' },
    { label: 'Settings', icon: '⚙', route: '/settings' },
  ];
}
