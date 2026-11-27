import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/auth.models';

describe('AuthService', () => {
  let logoutSpy: ReturnType<typeof vi.fn>;
  let refreshSpy: ReturnType<typeof vi.fn>;
  const response: LoginResponse = {
    success: true,
    data: {
      user: {
        id: 'user-1',
        name: 'Taylor Reed',
        email: 'taylor@example.test',
        roles: ['school_admin'],
        permissions: ['students.read'],
      },
      tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    },
  };

  beforeEach(() => {
    localStorage.clear();
    logoutSpy = vi.fn(() => of(undefined));
    refreshSpy = vi.fn(() => of({
      user: response.data.user,
      tokens: { accessToken: 'rotated-access-token', refreshToken: 'rotated-refresh-token' },
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: {
            login: vi.fn(() => of(response)),
            logout: logoutSpy,
            refresh: refreshSpy,
          },
        },
      ],
    });
  });

  it('stores the user and tokens from the documented login response', () => {
    const auth = TestBed.inject(AuthService);

    auth.login({ email: response.data.user.email, password: 'secret' }).subscribe();

    expect(auth.user()).toEqual(response.data.user);
    expect(auth.accessToken).toBe('access-token');
    expect(localStorage.getItem('erp.refreshToken')).toBe('refresh-token');
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.loading()).toBe(false);
  });

  it('clears local session data and returns to the login route on logout', () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    auth.storeSession(response.data.user, response.data.tokens);

    auth.logout();

    expect(auth.user()).toBeNull();
    expect(auth.accessToken).toBeNull();
    expect(localStorage.getItem('erp.refreshToken')).toBeNull();
    expect(logoutSpy).toHaveBeenCalledWith('refresh-token');
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('stores rotated access and refresh tokens after a successful refresh', () => {
    const auth = TestBed.inject(AuthService);
    auth.storeSession(response.data.user, response.data.tokens);
    let accessToken = '';

    auth.refreshAccessToken().subscribe((token) => { accessToken = token; });

    expect(refreshSpy).toHaveBeenCalledWith('refresh-token');
    expect(accessToken).toBe('rotated-access-token');
    expect(auth.accessToken).toBe('rotated-access-token');
    expect(localStorage.getItem('erp.refreshToken')).toBe('rotated-refresh-token');
  });
});
