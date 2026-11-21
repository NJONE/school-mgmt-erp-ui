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
    { label: 'Students', icon: '◎', route: '/management/students' },
    { label: 'Parents', icon: '♙', route: '/management/parents' },
    { label: 'Staff', icon: '♧', route: '/management/staff' },
    { label: 'Attendance', icon: '✓', route: '/attendance' },
    { label: 'Examination', icon: 'E', route: '/examinations' },
    { label: 'Fees & Finance', icon: '₹', route: '/fees' },
    { label: 'Library', icon: '▤', route: '/library' },
    { label: 'Transport', icon: 'T', route: '/transport' },
    { label: 'Communication', icon: '◉', route: '/communication' },
    { label: 'Reports', icon: '≡', route: '/reports' },
    { label: 'Settings', icon: '⚙', route: '/settings' },
  ];
}
