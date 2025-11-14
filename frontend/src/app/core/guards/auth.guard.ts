import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuth = await auth.isAuthenticated();
  if (!isAuth) {
    // redirect to login
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
