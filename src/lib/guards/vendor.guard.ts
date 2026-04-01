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

  if (!isBrowser) {
    return true;
  }

  if (vendorService.isVendor() && vendorService.vendorProfile()) {
    return true;
  }

  return vendorService.ensureProfileLoaded().pipe(
    map(() => {
      if (vendorService.isVendor() && vendorService.vendorProfile()) {
        return true;
      }
      return router.createUrlTree(['/profile/business']);
    })
  );
};
