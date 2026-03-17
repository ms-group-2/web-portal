import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { VendorService } from 'lib/services/vendor/vendor.service';

export const vendorGuard: CanActivateFn = () => {
  const vendorService = inject(VendorService);
  const router = inject(Router);

  if (vendorService.isVendor()) {
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
