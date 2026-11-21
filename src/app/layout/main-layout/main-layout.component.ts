import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell">
      <app-sidebar class="desktop-sidebar" [collapsed]="collapsed()" />
      @if (mobileOpen()) {
        <button class="backdrop" type="button" aria-label="Close navigation" (click)="mobileOpen.set(false)"></button>
        <app-sidebar class="mobile-sidebar" [collapsed]="false" />
      }
      <div class="workspace">
        <app-topbar (toggleSidebar)="toggleNavigation()" />
        <main><router-outlet /></main>
      </div>
    </div>
  `,
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  toggleNavigation(): void {
    if (window.matchMedia('(max-width: 900px)').matches) this.mobileOpen.update((open) => !open);
    else this.collapsed.update((value) => !value);
  }
}
