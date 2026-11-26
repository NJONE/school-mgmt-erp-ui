import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { ApiError } from '../../core/models/api.models';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ThemeService } from '../../core/services/theme.service';

interface PasswordForm {
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  template: `
    <div class="settings-page">
      <header class="page-heading">
        <p>Workspace</p>
        <h1>Preferences</h1>
        <span>Manage your appearance, current workspace, and sign-in security.</span>
      </header>

      <section class="settings-card">
        <div class="card-icon" aria-hidden="true">◐</div>
        <div class="card-copy">
          <h2>Appearance</h2>
          <p>Choose how EduCore looks on this device.</p>
        </div>
        <label class="theme-select">
          <span>Theme</span>
          <select [value]="theme.preference()" (change)="changeTheme($event)">
            <option value="system">Use system setting</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>

      <section class="settings-card context-card">
        <div class="card-icon" aria-hidden="true">⌂</div>
        <div class="card-copy">
          <h2>Current workspace</h2>
          <p>Context is sent with requests when supported by the service.</p>
        </div>
        <dl>
          <div><dt>School</dt><dd>{{ contextName(context.schools(), context.schoolId()) }}</dd></div>
          <div><dt>Branch</dt><dd>{{ contextName(context.branches(), context.branchId()) }}</dd></div>
          <div><dt>Academic session</dt><dd>{{ contextName(context.academicSessions(), context.academicSessionId()) }}</dd></div>
        </dl>
      </section>

      <section class="settings-card password-card">
        <div class="card-icon" aria-hidden="true">⌑</div>
        <div class="card-copy">
          <h2>Change password</h2>
          <p>Use your current password to set a new sign-in password.</p>
        </div>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
          @if (message()) { <div class="form-message" role="status">{{ message() }}</div> }
          @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }
          <label>Current password
            <input type="password" formControlName="currentPassword" autocomplete="current-password" />
          </label>
          <label>New password
            <input type="password" formControlName="newPassword" autocomplete="new-password" />
            @if (passwordForm.controls.newPassword.touched && passwordForm.controls.newPassword.invalid) {
              <small>Use at least 8 characters.</small>
            }
          </label>
          <label>Confirm new password
            <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
          </label>
          @if (passwordMismatch()) { <small class="validation-message">Passwords do not match.</small> }
          <button type="submit" [disabled]="passwordForm.invalid || passwordMismatch() || saving()">
            {{ saving() ? 'Updating…' : 'Update password' }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: `
    :host { display: block; }
    .settings-page { width: min(1050px, 100%); margin: 0 auto; padding: 28px; }
    .page-heading { margin-bottom: 22px; }
    .page-heading p { margin: 0; color: var(--text-muted); font-size: 13px; }
    h1 { margin: 5px 0; color: var(--text-primary); font-size: 27px; letter-spacing: -.035em; }
    .page-heading > span { color: var(--text-secondary); font-size: 13px; }
    .settings-card { display: grid; grid-template-columns: 42px minmax(160px, 1fr) minmax(210px, 280px); align-items: start; gap: 15px; margin-bottom: 14px; padding: 20px; border: 1px solid var(--border); border-radius: 13px; background: var(--surface); box-shadow: var(--shadow-sm); }
    .card-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 11px; background: var(--primary-soft); color: var(--primary); font-size: 18px; font-weight: 800; }
    h2 { margin: 1px 0 5px; color: var(--text-primary); font-size: 15px; }
    .card-copy p { margin: 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
    .theme-select { display: grid; gap: 7px; color: var(--text-secondary); font-size: 11px; font-weight: 750; }
    select, input { min-height: 40px; border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; background: var(--surface); color: var(--text-primary); font: inherit; }
    .context-card dl { grid-column: 2 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0; }
    .context-card dl div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: 9px; background: var(--background); }
    dt { color: var(--text-muted); font-size: 10px; }
    dd { overflow: hidden; margin: 5px 0 0; color: var(--text-primary); font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .password-card { grid-template-columns: 42px minmax(160px, 1fr) minmax(280px, 380px); }
    .password-card form { display: grid; gap: 12px; }
    .password-card label { display: grid; gap: 6px; color: var(--text-secondary); font-size: 11px; font-weight: 750; }
    .password-card small { color: var(--text-muted); font-size: 10px; }
    .password-card button { min-height: 40px; border: 0; border-radius: 8px; background: var(--primary); color: white; font: inherit; font-size: 12px; font-weight: 750; cursor: pointer; }
    .password-card button:disabled { opacity: .5; cursor: not-allowed; }
    .form-message, .form-error { padding: 9px 10px; border-radius: 8px; font-size: 11px; }
    .form-message { background: color-mix(in srgb, var(--success) 10%, var(--surface)); color: var(--success); }
    .form-error, .validation-message { background: color-mix(in srgb, var(--error) 9%, var(--surface)); color: var(--error) !important; }
    @media (max-width: 700px) {
      .settings-page { padding: 18px 14px; }
      .settings-card, .password-card { grid-template-columns: 40px 1fr; }
      .theme-select, .context-card dl, .password-card form { grid-column: 1 / -1; }
      .context-card dl { grid-template-columns: 1fr; }
    }
  `,
})
export class SettingsComponent {
  readonly theme = inject(ThemeService);
  readonly context = inject(TenantContextService);
  private readonly authApi = inject(AuthApiService);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly passwordForm = new FormGroup<PasswordForm>({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  passwordMismatch(): boolean {
    const form = this.passwordForm.getRawValue();
    return !!form.confirmPassword && form.newPassword !== form.confirmPassword;
  }

  changeTheme(event: Event): void {
    const preference = (event.target as HTMLSelectElement).value;
    if (preference === 'system' || preference === 'light' || preference === 'dark') {
      this.theme.setPreference(preference);
    }
  }

  contextName(options: Array<{ id: string; name: string }>, id: string | null): string {
    if (!id) return 'All available';
    return options.find((option) => option.id === id)?.name ?? 'Selected';
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch() || this.saving()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    this.authApi.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.message.set('Your password has been updated.');
        this.saving.set(false);
      },
      error: (error: ApiError) => {
        this.error.set(error.message ?? 'Your password could not be updated.');
        this.saving.set(false);
      },
    });
  }
}
