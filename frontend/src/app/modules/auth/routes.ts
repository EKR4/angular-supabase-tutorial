import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    title: 'Login'
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent),
    title: 'Sign Up'
  },
  
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];