import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClientService } from '../services/api-client.service';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService backend contract', () => {
  it('adapts the backend session and identity response', () => {
    const api = {
      post: vi.fn(() => of({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: '15m',
          identity: {
            id: 'user-id',
            userId: 'user-id',
            name: 'Platform Admin',
            email: 'admin@example.test',
            roles: ['platform_admin'],
            roleKeys: ['platform_admin'],
            permissions: ['tenants.read'],
            isPlatformAdmin: true,
            tenantId: null,
            schoolId: null,
            branchId: null,
            academicSessionId: null,
          },
        },
      })),
      get: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [AuthApiService, { provide: ApiClientService, useValue: api }],
    });

    let result: unknown;
    TestBed.inject(AuthApiService).login({
      email: 'admin@example.test',
      password: 'a-valid-password',
    }).subscribe((response) => { result = response; });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@example.test',
      password: 'a-valid-password',
    });
    expect(result).toEqual({
      success: true,
      data: {
        user: {
          id: 'user-id',
          name: 'Platform Admin',
          email: 'admin@example.test',
          avatarUrl: undefined,
          roles: ['platform_admin'],
          permissions: ['tenants.read'],
          isPlatformAdmin: true,
          tenantId: null,
          schoolId: null,
          branchId: null,
          academicSessionId: null,
          roleKeys: ['platform_admin'],
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: '15m',
        },
      },
      message: undefined,
    });
  });

  it('sends backend refresh-token and password-change DTOs', () => {
    const api = { post: vi.fn(() => of({ success: true, data: null })) };
    TestBed.configureTestingModule({
      providers: [AuthApiService, { provide: ApiClientService, useValue: api }],
    });
    const auth = TestBed.inject(AuthApiService);

    auth.logout('refresh-token').subscribe();
    auth.changePassword('old-password', 'new-password-long-enough').subscribe();

    expect(api.post).toHaveBeenNthCalledWith(1, '/auth/logout', { refreshToken: 'refresh-token' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/auth/change-password', {
      currentPassword: 'old-password',
      newPassword: 'new-password-long-enough',
    });
  });

  it('creates users through the secure auth endpoint', () => {
    const api = { post: vi.fn(() => of({ success: true, data: null })) };
    TestBed.configureTestingModule({
      providers: [AuthApiService, { provide: ApiClientService, useValue: api }],
    });
    const request = {
      email: 'new-user@example.test',
      displayName: 'New User',
      password: 'a-secure-password-123',
      roleKeys: ['teacher'],
    };

    TestBed.inject(AuthApiService).createUser(request).subscribe();

    expect(api.post).toHaveBeenCalledWith('/auth/users', request);
  });
});