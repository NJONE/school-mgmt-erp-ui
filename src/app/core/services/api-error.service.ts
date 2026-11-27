import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  fromHttpError(error: HttpErrorResponse): ApiError {
    const body = asRecord(error.error);
    const nestedError = asRecord(body?.['error']);
    const message = body?.['message'] ?? nestedError?.['message'] ?? this.defaultMessage(error.status);
    return {
      status: error.status,
      message: typeof message === 'string' ? message : this.defaultMessage(error.status),
      validationErrors: this.validationErrors(body?.['errors']),
      retryable: error.status === 429 || error.status === 0 || error.status >= 500,
    };
  }

  private validationErrors(errors: unknown): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    if (Array.isArray(errors)) {
      for (const issue of errors) {
        const record = asRecord(issue);
        if (!record || typeof record['message'] !== 'string') continue;
        const path = Array.isArray(record['path'])
          ? record['path'].map(String).join('.')
          : typeof record['field'] === 'string' ? record['field'] : '';
        if (!path) continue;
        result[path] = [...(result[path] ?? []), record['message']];
      }
      return result;
    }
    const record = asRecord(errors);
    if (!record) return result;
    for (const [field, value] of Object.entries(record)) {
      if (typeof value === 'string') result[field] = [value];
      else if (Array.isArray(value)) result[field] = value.filter((item): item is string => typeof item === 'string');
    }
    return result;
  }

  private defaultMessage(status: number): string {
    switch (status) {
      case 400: return 'The request could not be processed.';
      case 401: return 'Your session has expired. Please sign in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'The request conflicts with the current resource state.';
      case 422: return 'Please correct the highlighted fields.';
      case 429: return 'Too many requests. Please try again shortly.';
      case 423: return 'This account is temporarily locked. Try again later.';
      case 0: return 'Unable to reach the server. Check your connection.';
      default: return 'An unexpected server error occurred.';
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
