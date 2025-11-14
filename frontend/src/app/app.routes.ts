import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes (CSR)
  {
    path: '',
    loadChildren: () => import('./pages/routes').then(m => m.PUBLIC_ROUTES)
  },

  // Auth routes (SSR)
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/routes').then(m => m.AUTH_ROUTES)
    // SSR handled in serverRoutes
  },

  // Admin routes (protected, SSR)
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./modules/admin/routes').then(m => m.ADMIN_ROUTES)
    // SSR handled in serverRoutes
  },

  // Company routes (protected, SSR)
  {
    path: 'company',
    canActivate: [authGuard],
    data: { roles: ['company'] },
    loadChildren: () => import('./modules/company/routes').then(m => m.COMPANY_ROUTES)
    // SSR handled in serverRoutes
  },

  // Customer routes (protected, SSR)
  {
    path: 'customer',
    canActivate: [authGuard],
    data: { roles: ['customer'] },
    loadChildren: () => import('./modules/customer/routes').then(m => m.CUSTOMER_ROUTES)
    // SSR handled in serverRoutes
  },

  // Not found
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];