import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService backend errors', () => {
  it('maps Zod issue paths to field validation errors', () => {
    const service = new ApiErrorService();
    const error = service.fromHttpError(new HttpErrorResponse({
      status: 400,
      error: {
        success: false,
        message: 'Validation failed',
        errors: [
          { path: ['email'], message: 'Invalid email address' },
          { path: ['profile', 'name'], message: 'Name is required' },
        ],
      },
    }));

    expect(error.message).toBe('Validation failed');
    expect(error.validationErrors).toEqual({
      email: ['Invalid email address'],
      'profile.name': ['Name is required'],
    });
  });

  it('shows the backend account-lock status', () => {
    const error = new ApiErrorService().fromHttpError(new HttpErrorResponse({ status: 423 }));

    expect(error.message).toBe('This account is temporarily locked. Try again later.');
  });
});