import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(catchError((error: unknown) => {
    if (
      !(error instanceof HttpErrorResponse)
      || error.status !== 401
      || !auth.refreshToken
      || request.context.get(AUTH_RETRY)
      || isAuthSessionEndpoint(request.url)
    ) {
      return throwError(() => error);
    }

    return auth.refreshAccessToken().pipe(
      switchMap((accessToken) => next(request.clone({
        context: request.context.set(AUTH_RETRY, true),
        setHeaders: { Authorization: `Bearer ${accessToken}` },
      }))),
    );
  }));
};

function isAuthSessionEndpoint(url: string): boolean {
  return ['/auth/login', '/auth/refresh', '/auth/logout'].some((path) => url.endsWith(path));
}
