import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap, catchError, of } from 'rxjs';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { BookingProviderApiService } from 'lib/services/booking';

/**
 * Original guard: allows only seller vendors.
 */
export const vendorGuard: CanActivateFn = () => {
  const vendorService = inject(VendorService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
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
    }),
  );
};

/**
 * Allows both seller vendors AND booking providers to access the dashboard.
 */
export const vendorOrProviderGuard: CanActivateFn = () => {
  const vendorService = inject(VendorService);
  const providerApi = inject(BookingProviderApiService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (vendorService.isVendor() && vendorService.vendorProfile()) {
    return true;
  }

  return vendorService.ensureProfileLoaded().pipe(
    switchMap(() => {
      if (vendorService.isVendor() && vendorService.vendorProfile()) {
        return of(true as const);
      }
      // Not a seller — check if booking provider
      return providerApi.getMyProfile().pipe(
        map(() => true as const),
        catchError(() => of(false as const)),
      );
    }),
    map(allowed => allowed || router.createUrlTree(['/profile/business'])),
  );
};
