import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../models/api.models';
import { ApiErrorService } from './api-error.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorService);

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<ApiEnvelope<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  post<T>(path: string, body?: unknown): Observable<ApiEnvelope<T>> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Observable<ApiEnvelope<T>> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Observable<ApiEnvelope<T>> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Observable<ApiEnvelope<T>> {
    return this.request<T>('DELETE', path);
  }

  private request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>,
  ): Observable<ApiEnvelope<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }
    const url = `${environment.apiBaseUrl}${path}`;
    let response: Observable<ApiEnvelope<T>>;
    if (method === 'GET') response = this.http.get<ApiEnvelope<T>>(url, { params: httpParams });
    else if (method === 'DELETE') response = this.http.delete<ApiEnvelope<T>>(url);
    else if (method === 'POST') response = this.http.post<ApiEnvelope<T>>(url, body);
    else if (method === 'PUT') response = this.http.put<ApiEnvelope<T>>(url, body);
    else response = this.http.patch<ApiEnvelope<T>>(url, body);

    return response.pipe(
      timeout(environment.apiTimeoutMs),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => this.errorHandler.fromHttpError(error));
        }
        if (error instanceof TimeoutError) {
          return throwError(() => ({
            status: 0,
            message: 'The request timed out. Please try again.',
            validationErrors: {},
            retryable: true,
          }));
        }
        return throwError(() => error);
      }),
    );
  }
}
