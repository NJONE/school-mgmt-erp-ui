import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TenantContextService } from './core/tenant/tenant-context.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly context = inject(TenantContextService);
  private readonly theme = inject(ThemeService);
}
