import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permissions = route.data['permissions'] as string[] | undefined
    ?? routePermissionFromEntity(route);
  if (!permissions?.length) return true;
  const allowed = permissions.some((permission) => auth.hasPermission(permission));
  return allowed ? true : router.createUrlTree(['/unauthorized']);
};

function routePermissionFromEntity(route: ActivatedRouteSnapshot): string[] | undefined {
  const entity = route.paramMap.get('entity');
  return entity ? [`${entity}.view`] : undefined;
}
