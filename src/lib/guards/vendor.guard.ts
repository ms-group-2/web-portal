import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { VendorService } from 'lib/services/vendor/vendor.service';

export const vendorGuard: CanActivateFn = () => {
  const vendorService = inject(VendorService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // During SSR/prerender we cannot reliably access browser token storage.
  // Avoid server-side redirects that cause refresh bounces to /profile.
  if (!isBrowser) {
    return true;
  }

  if (vendorService.isVendor() && vendorService.vendorProfile()) {
    return true;
  }

  return vendorService.ensureProfileLoaded().pipe(
    map(profile => {
      if (profile) {
        return true;
      } else {
        return router.createUrlTree(['/profile']);
      }
    })
  );
};
