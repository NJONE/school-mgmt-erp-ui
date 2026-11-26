import { Component, input, output } from '@angular/core';

export type FeedbackKind = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-feedback-state',
  template: `
    <section class="feedback" [class.compact]="compact()" [attr.role]="kind() === 'error' ? 'alert' : 'status'">
      @if (kind() === 'loading') {
        <span class="spinner" aria-hidden="true"></span>
      } @else if (kind() === 'empty') {
        <span class="state-icon" aria-hidden="true">⌕</span>
      } @else {
        <span class="state-icon error-icon" aria-hidden="true">!</span>
      }
      <h2>{{ title() }}</h2>
      @if (message()) { <p>{{ message() }}</p> }
      @if (actionLabel()) {
        <button type="button" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .feedback { min-height: 220px; padding: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-secondary); }
    .feedback.compact { min-height: 140px; padding: 18px; }
    h2 { margin: 12px 0 0; color: var(--text-primary); font-size: 16px; }
    p { max-width: 440px; margin: 7px 0 0; font-size: 13px; line-height: 1.5; }
    .state-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-hover); color: var(--text-muted); font-size: 22px; font-weight: 800; }
    .error-icon { background: color-mix(in srgb, var(--error) 12%, var(--surface)); color: var(--error); }
    .spinner { width: 26px; height: 26px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .75s linear infinite; }
    button { margin-top: 14px; min-height: 38px; padding: 0 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text-primary); font: inherit; font-weight: 700; cursor: pointer; }
    button:hover { border-color: var(--primary); color: var(--primary); }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2s; } }
  `,
})
export class FeedbackStateComponent {
  readonly kind = input.required<FeedbackKind>();
  readonly title = input.required<string>();
  readonly message = input('');
  readonly actionLabel = input('');
  readonly compact = input(false);
  readonly action = output<void>();
}

@Component({
  selector: 'app-status-badge',
  template: `<span [class]="'badge ' + tone()">{{ value() || 'Unknown' }}</span>`,
  styles: `
    :host { display: inline-flex; }
    .badge { display: inline-flex; align-items: center; min-height: 23px; padding: 2px 9px; border-radius: 999px; background: var(--surface-hover); color: var(--text-secondary); font-size: 11px; font-weight: 750; text-transform: capitalize; white-space: nowrap; }
    .positive { background: color-mix(in srgb, var(--success) 14%, var(--surface)); color: color-mix(in srgb, var(--success) 80%, #064e3b); }
    .warning { background: color-mix(in srgb, var(--warning) 16%, var(--surface)); color: #92400e; }
    .negative { background: color-mix(in srgb, var(--error) 12%, var(--surface)); color: #b91c1c; }
    .info { background: color-mix(in srgb, var(--primary) 12%, var(--surface)); color: var(--primary); }
  `,
})
export class StatusBadgeComponent {
  readonly value = input('');

  tone(): string {
    const status = this.value().toLowerCase();
    if (['active', 'present', 'paid', 'approved', 'published', 'available', 'pass', 'issued'].includes(status)) return 'positive';
    if (['pending', 'partial', 'overdue', 'scheduled', 'draft', 'trial', 'in_progress'].includes(status)) return 'warning';
    if (['inactive', 'absent', 'rejected', 'failed', 'cancelled', 'suspended', 'voided'].includes(status)) return 'negative';
    return 'info';
  }
}
