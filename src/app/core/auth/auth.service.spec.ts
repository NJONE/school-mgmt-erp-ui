import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/auth.models';

describe('AuthService', () => {
  const response: LoginResponse = {
    success: true,
    data: {
      user: {
        id: 'user-1',
        name: 'Taylor Reed',
        email: 'taylor@example.test',
        roles: ['school_admin'],
        permissions: ['students.view'],
      },
      tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: {
            login: vi.fn(() => of(response)),
            logout: vi.fn(() => of(undefined)),
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
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
