import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const COMPANY_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { roles: ['company'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
