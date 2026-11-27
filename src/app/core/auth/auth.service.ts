import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { AuthTokens, AuthUser, LoginRequest, LoginResponse } from '../models/auth.models';
import { AuthApiService } from './auth-api.service';
import { TenantContextService } from '../tenant/tenant-context.service';

const ACCESS_TOKEN_KEY = 'erp.accessToken';
const REFRESH_TOKEN_KEY = 'erp.refreshToken';
const USER_KEY = 'erp.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly context = inject(TenantContextService);
  private readonly userSignal = signal<AuthUser | null>(this.readUser());
  private readonly loadingSignal = signal(false);
  private refreshInFlight: Observable<string> | undefined;

  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly logoutWarning = signal('');
  readonly isAuthenticated = computed(() => this.userSignal() !== null || !!this.accessToken);

  constructor() {
    this.context.syncIdentityScope(this.userSignal());
  }

  get accessToken(): string | null {
    return this.storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  }

  get refreshToken(): string | null {
    return this.storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    this.loadingSignal.set(true);
    this.logoutWarning.set('');
    return this.api.login(request).pipe(
      tap((response) => this.storeSession(response.data.user, response.data.tokens)),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const refreshToken = this.refreshToken;
    if (!refreshToken) return throwError(() => new Error('No refresh token is available.'));

    this.refreshInFlight = this.api.refresh(refreshToken).pipe(
      tap((session) => this.storeSession(session.user, session.tokens)),
      map(() => this.accessToken ?? ''),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
      finalize(() => { this.refreshInFlight = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight;
  }

  logout(): void {
    const refreshToken = this.storage()?.getItem(REFRESH_TOKEN_KEY) ?? undefined;
    this.api.logout(refreshToken).subscribe({
      error: (error: unknown) => {
        const detail = typeof error === 'object' && error !== null && 'message' in error
          ? String(error['message'])
          : '';
        this.logoutWarning.set(detail
          ? `You are signed out on this device, but the service could not invalidate the remote session: ${detail}`
          : 'You are signed out on this device, but the service could not invalidate the remote session.');
      },
    });
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  clearSession(): void {
    const storage = this.storage();
    storage?.removeItem(ACCESS_TOKEN_KEY);
    storage?.removeItem(REFRESH_TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    this.userSignal.set(null);
    this.context.syncIdentityScope(null);
  }

  hasPermission(permission: string): boolean {
    return this.userSignal()?.permissions.includes(permission) === true;
  }

  storeSession(user: AuthUser, tokens: AuthTokens): void {
    const storage = this.storage();
    storage?.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) storage?.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    else storage?.removeItem(REFRESH_TOKEN_KEY);
    storage?.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
    this.context.syncIdentityScope(user);
  }

  private readUser(): AuthUser | null {
    const storage = this.storage();
    const raw = storage?.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      storage?.removeItem(USER_KEY);
      return null;
    }
  }

  private storage(): Storage | undefined {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  }
}
