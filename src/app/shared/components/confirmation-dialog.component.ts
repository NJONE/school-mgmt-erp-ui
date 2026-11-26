import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  template: `
    @if (open()) {
      <div class="backdrop" (click)="cancel.emit()">
        <section
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirmation-title'"
          [attr.aria-describedby]="'confirmation-message'"
          (click)="$event.stopPropagation()"
        >
          <span class="icon" [class.danger]="danger()" aria-hidden="true">{{ danger() ? '!' : '?' }}</span>
          <h2 id="confirmation-title">{{ title() }}</h2>
          <p id="confirmation-message">{{ message() }}</p>
          <footer>
            <button type="button" class="cancel" (click)="cancel.emit()">Cancel</button>
            <button type="button" [class.danger-button]="danger()" class="confirm" (click)="confirm.emit()">
              {{ confirmLabel() }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: `
    :host { display: contents; }
    .backdrop { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 18px; background: rgba(15, 23, 42, .48); }
    .dialog { width: min(420px, 100%); padding: 26px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); box-shadow: var(--shadow-lg); text-align: center; }
    .icon { width: 44px; height: 44px; margin: 0 auto; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 21px; font-weight: 850; }
    .icon.danger { background: color-mix(in srgb, var(--error) 12%, var(--surface)); color: var(--error); }
    h2 { margin: 15px 0 7px; color: var(--text-primary); font-size: 19px; }
    p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.55; }
    footer { display: flex; justify-content: center; gap: 9px; margin-top: 23px; }
    button { min-height: 40px; padding: 0 15px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text-primary); font: inherit; font-size: 13px; font-weight: 750; cursor: pointer; }
    .confirm { border-color: var(--primary); background: var(--primary); color: white; }
    .danger-button { border-color: var(--error); background: var(--error); }
  `,
})
export class ConfirmationDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirm action');
  readonly message = input('Are you sure you want to continue?');
  readonly confirmLabel = input('Confirm');
  readonly danger = input(false);
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
