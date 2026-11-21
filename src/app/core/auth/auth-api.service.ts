import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.models';
import { ApiClientService } from '../services/api-client.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiClientService);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse['data']>(API_ENDPOINTS.auth.login, request).pipe(
      map((response) => ({ success: response.success, data: response.data, message: response.message })),
    );
  }

  logout(): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.logout);
  }

  me(): Observable<AuthUser> {
    return this.api.get<AuthUser>(API_ENDPOINTS.auth.me).pipe(map((response) => response.data));
  }

  refresh(refreshToken: string): Observable<LoginResponse['data']> {
    return this.api.post<LoginResponse['data']>(API_ENDPOINTS.auth.refresh, { refreshToken }).pipe(
      map((response) => response.data),
    );
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.forgotPassword, { email });
  }

  resetPassword(token: string, password: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.resetPassword, { token, password });
  }

  changePassword(currentPassword: string, password: string): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.auth.changePassword, { currentPassword, password });
  }
}
