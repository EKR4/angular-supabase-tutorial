import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Admin Dashboard'
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];