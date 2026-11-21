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
        data: { permissions: ['management.view'] },
        loadComponent: () => import('./features/dynamic-management.component').then((m) => m.DynamicManagementComponent),
      },
      { path: 'attendance', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Attendance' } },
      { path: 'examinations', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Examinations' } },
      { path: 'fees', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Fees & Finance' } },
      { path: 'library', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Library' } },
      { path: 'transport', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Transport' } },
      { path: 'communication', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Communication' } },
      { path: 'reports', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Reports' } },
      { path: 'settings', loadComponent: () => import('./features/management-placeholder.component').then((m) => m.ManagementPlaceholderComponent), data: { title: 'Settings' } },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
