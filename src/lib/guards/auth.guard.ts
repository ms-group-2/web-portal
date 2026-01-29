import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/lib/services/identity/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // TODO: Implement authentication logic
  // For now, allow access (replace with actual auth check)
  return true;

  // Example: redirect to sign-in if not authenticated
  // if (!auth.isAuthenticated()) {
  //   router.navigate(['/auth/sign-in']);
  //   return false;
  // }
  // return true;
};
