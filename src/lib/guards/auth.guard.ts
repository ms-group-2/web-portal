import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'lib/services/identity/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // During SSR/prerender we cannot reliably know auth state (no localStorage).
  // Avoid server-side redirects that would cause refresh "bounces".
  if (!isBrowser) {
    return true;
  }

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/sign-in']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  if (!isBrowser) {
    return true;
  }

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/landing']);
  }

  return true;
};