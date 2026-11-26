import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../tenant/tenant-context.service';

export const contextInterceptor: HttpInterceptorFn = (request, next) => {
  const context = inject(TenantContextService);
  const headers: Record<string, string> = {};
  if (context.tenantId()) headers['X-Tenant-ID'] = context.tenantId()!;
  if (context.schoolId()) headers['X-School-ID'] = context.schoolId()!;
  if (context.branchId()) headers['X-Branch-ID'] = context.branchId()!;
  if (context.academicSessionId()) headers['X-Academic-Session-ID'] = context.academicSessionId()!;
  return next(request.clone({ setHeaders: headers }));
};
