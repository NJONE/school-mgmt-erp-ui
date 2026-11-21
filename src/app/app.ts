import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TenantContextService } from './core/tenant/tenant-context.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('school-mgmt-erp-ui');
  private readonly context = inject(TenantContextService);

  constructor() {
    const savedTheme = localStorage.getItem('erp.theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }
}
