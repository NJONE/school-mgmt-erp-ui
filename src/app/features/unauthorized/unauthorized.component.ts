import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink],
  template: `
    <div class="state-page">
      <div class="code">403</div>
      <h1>Access denied</h1>
      <p>You do not have permission to view this workspace.</p>
      <a routerLink="/dashboard">Return to dashboard</a>
    </div>
  `,
  styles: `.state-page{min-height:60vh;display:grid;place-content:center;text-align:center}.code{font-size:58px;font-weight:900;color:var(--primary)}h1{margin:8px 0}p{color:var(--text-secondary)}a{justify-self:center;margin-top:12px;color:white;text-decoration:none;background:var(--primary);border-radius:9px;padding:11px 16px;font-weight:700}`,
})
export class UnauthorizedComponent {}
