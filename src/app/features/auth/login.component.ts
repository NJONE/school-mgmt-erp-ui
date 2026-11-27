import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/models/api.models';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  rememberMe: FormControl<boolean>;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <section class="login-story">
        <div class="brand"><span class="brand-mark">E</span><div><strong>EduCore</strong><small>School ERP</small></div></div>
        <div class="story-copy">
          <span class="eyebrow">Unified school operations</span>
          <h1>Run every school operation from one secure workspace.</h1>
          <p>Manage academics, people, finance, and communication with clarity.</p>
        </div>
        <div class="trust"><span>●</span> Enterprise secure access</div>
      </section>
      <section class="login-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="mobile-brand"><span class="brand-mark">E</span><strong>EduCore</strong></div>
          <h2>Welcome back</h2>
          <p class="subtitle">Sign in to continue to your workspace</p>
          @if (auth.logoutWarning()) { <div class="form-warning" role="status">{{ auth.logoutWarning() }}</div> }
          @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }
          <label>Email or username
            <input type="text" formControlName="email" autocomplete="username" placeholder="name@school.edu or username" />
          </label>
          <label>Password
            <div class="password-wrap">
              <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Enter your password" />
              <button type="button" (click)="showPassword.update(v => !v)" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">{{ showPassword() ? 'Hide' : 'Show' }}</button>
            </div>
          </label>
          <div class="form-row">
            <label class="checkbox"><input type="checkbox" formControlName="rememberMe" /> <span>Remember me</span></label>
          </div>
          <button class="primary-button" type="submit" [disabled]="form.invalid || auth.loading()">
            {{ auth.loading() ? 'Signing in…' : 'Sign in' }}
          </button>
          <p class="support">For access or password help, contact your school administrator.</p>
        </form>
      </section>
    </div>
  `,
  styleUrl: './login.scss',
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (apiError: ApiError) => this.error.set(apiError.message),
    });
  }

}
