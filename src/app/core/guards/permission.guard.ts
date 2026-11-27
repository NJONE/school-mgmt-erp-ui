import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiClientService } from '../services/api-client.service';
import { EntityMetadataRegistry } from '../metadata/entity-registry.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const registry = inject(EntityMetadataRegistry);
  const api = inject(ApiClientService);
  const routePermissions = route.data['permissions'] as string[] | undefined;
  const entityKey = route.paramMap.get('entity');

  if (!entityKey) return routePermissions?.length ? checkPermissions(routePermissions) : true;

  return registry.loadFromBackend(api).pipe(
    map(() => {
      const metadata = registry.get(entityKey);
      const permissions = routePermissions ?? (metadata?.permissions?.list ? [metadata.permissions.list] : []);
      if (!metadata || !permissions.length) return router.createUrlTree(['/unauthorized']);
      if (['platform', 'subscriptions', 'tenants'].includes(metadata.module ?? '') && !auth.user()?.isPlatformAdmin) {
        return router.createUrlTree(['/unauthorized']);
      }
      return checkPermissions(permissions);
    }),
    catchError(() => of(router.createUrlTree(['/unauthorized']))),
  );

  function checkPermissions(permissions: string[]) {
    const allowed = permissions.some((permission) => auth.hasPermission(permission));
    return allowed ? true : router.createUrlTree(['/unauthorized']);
  }
};
