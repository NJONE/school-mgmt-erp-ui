import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { AuthUser, CreateUserRequest, LoginRequest, LoginResponse } from '../models/auth.models';
import { ApiClientService } from '../services/api-client.service';
import { ApiError } from '../models/api.models';

interface BackendIdentity {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
  tenantId: string | null;
  schoolId: string | null;
  branchId: string | null;
  academicSessionId: string | null;
  roleKeys: string[];
}

interface BackendSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  identity: BackendIdentity;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiClientService);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api.post<BackendSession>(API_ENDPOINTS.auth.login, request).pipe(
      map((response) => ({
        success: response.success,
        data: this.toFrontendSession(response.data),
        message: response.message,
      })),
    );
  }

  logout(refreshToken?: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : {});
  }

  me(): Observable<AuthUser> {
    return this.api.get<BackendIdentity>(API_ENDPOINTS.auth.me).pipe(map((response) => this.toFrontendUser(response.data)));
  }

  refresh(refreshToken: string): Observable<LoginResponse['data']> {
    return this.api.post<BackendSession>(API_ENDPOINTS.auth.refresh, { refreshToken }).pipe(
      map((response) => this.toFrontendSession(response.data)),
    );
  }

  createUser(request: CreateUserRequest): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.users, request);
  }

  forgotPassword(email: string): Observable<unknown> {
    void email;
    return this.unsupportedRecovery();
  }

  resetPassword(token: string, password: string): Observable<unknown> {
    void token;
    void password;
    return this.unsupportedRecovery();
  }

  changePassword(currentPassword: string, password: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.changePassword, { currentPassword, newPassword: password });
  }

  private toFrontendSession(session: BackendSession): LoginResponse['data'] {
    return {
      user: this.toFrontendUser(session.identity),
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      },
    };
  }

  private toFrontendUser(identity: BackendIdentity): AuthUser {
    return {
      id: identity.id,
      name: identity.name,
      email: identity.email,
      avatarUrl: identity.avatarUrl,
      roles: identity.roles,
      permissions: identity.permissions,
      isPlatformAdmin: identity.isPlatformAdmin,
      tenantId: identity.tenantId,
      schoolId: identity.schoolId,
      branchId: identity.branchId,
      academicSessionId: identity.academicSessionId,
      roleKeys: identity.roleKeys,
    };
  }

  private unsupportedRecovery(): Observable<never> {
    const error: ApiError = {
      status: 501,
      message: 'Password recovery is not supported by the configured service.',
      validationErrors: {},
      retryable: false,
    };
    return throwError(() => error);
  }
}
