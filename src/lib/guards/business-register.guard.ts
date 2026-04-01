import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { VendorService } from 'lib/services/vendor/vendor.service';

/**
 * Blocks /business/register when the user already submitted an application (pending)
 * or is an approved vendor — they belong on /profile/business instead.
 */
export const businessRegisterGuard: CanActivateFn = () => {
  const vendorService = inject(VendorService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return vendorService.ensureProfileLoaded().pipe(
    map(() => {
      if (vendorService.isPendingApproval()) {
        return router.createUrlTree(['/profile/business']);
      }
      if (vendorService.isVendor()) {
        return router.createUrlTree(['/profile/business']);
      }
      return true;
    })
  );
};
