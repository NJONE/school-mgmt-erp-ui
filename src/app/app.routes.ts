import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'management/:entity',
        canActivate: [permissionGuard],
        loadComponent: () => import('./features/dynamic-management.component').then((m) => m.DynamicManagementComponent),
      },
      { path: 'attendance', redirectTo: 'management/attendance', pathMatch: 'full' },
      { path: 'examinations', redirectTo: 'management/examinations', pathMatch: 'full' },
      { path: 'fees', redirectTo: 'management/fee-categories', pathMatch: 'full' },
      { path: 'library', redirectTo: 'management/library', pathMatch: 'full' },
      { path: 'transport', redirectTo: 'management/transport', pathMatch: 'full' },
      { path: 'communication', redirectTo: 'management/communication', pathMatch: 'full' },
      { path: 'reports', redirectTo: 'management/reports', pathMatch: 'full' },
      { path: 'settings', redirectTo: 'management/platform-configuration', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
