import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-management-placeholder',
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-header"><div><p>Management</p><h1>{{ title }}</h1></div></header>
      <section class="empty">
        <div class="empty-icon">▦</div>
        <h2>Ready for backend integration</h2>
        <p>This module route is active. Its endpoint and metadata will be connected when the backend repository contract is available.</p>
        <a routerLink="/dashboard">Back to dashboard</a>
      </section>
    </div>
  `,
  styles: `.page{padding:28px}.page-header p{color:var(--text-muted);font-size:13px}.page-header h1{margin:5px 0 24px}.empty{max-width:620px;margin:80px auto;text-align:center;border:1px solid var(--border);border-radius:13px;background:var(--surface);padding:48px}.empty-icon{width:54px;height:54px;border-radius:14px;margin:auto;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:22px}.empty h2{margin:18px 0 8px}.empty p{color:var(--text-secondary);line-height:1.6}.empty a{display:inline-block;margin-top:12px;text-decoration:none;color:white;background:var(--primary);border-radius:9px;padding:10px 14px;font-weight:700}`,
})
export class ManagementPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string ?? 'Management';
}
