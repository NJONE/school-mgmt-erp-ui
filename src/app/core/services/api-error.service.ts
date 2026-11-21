import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  fromHttpError(error: HttpErrorResponse): ApiError {
    const body = error.error as
      | { message?: string; error?: { message?: string }; errors?: Record<string, string[]> }
      | null;
    const message = body?.message ?? body?.error?.message ?? this.defaultMessage(error.status);
    return {
      status: error.status,
      message,
      validationErrors: body?.errors ?? {},
      retryable: error.status === 429 || error.status === 0 || error.status >= 500,
    };
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
      case 0: return 'Unable to reach the server. Check your connection.';
      default: return 'An unexpected server error occurred.';
    }
  }
}
