import { CanActivateChildFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateChildFn = async (childRoute, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = childRoute.data?.['roles'] ?? childRoute.parent?.data?.['roles'];
  if (!required) return true; // no role required

  const roles: string[] = Array.isArray(required) ? required : [required];

  for (const r of roles) {
    if (await auth.hasRole(r)) return true;
  }

  // Not authorized
  router.navigate(['/unauthorized']);
  return false;
};
