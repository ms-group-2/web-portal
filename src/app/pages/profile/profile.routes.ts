import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profile-shell/profile-shell').then((m) => m.ProfileShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'settings',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./sections/profile-settings/profile-settings').then(
            (m) => m.ProfileSettingsComponent
          ),
      },
      {
        path: 'my-posts',
        loadComponent: () =>
          import('./sections/my-posts/my-posts').then((m) => m.MyPostsComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./sections/wishlist/wishlist').then((m) => m.WishlistComponent),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./sections/addresses/addresses').then((m) => m.AddressesComponent),
      },
      {
        path: 'history/swap',
        loadComponent: () =>
          import('./sections/swap-history/swap-history').then(
            (m) => m.SwapHistoryComponent
          ),
      },
      {
        path: 'history/shop',
        loadComponent: () =>
          import('./sections/shop-history/shop-history').then(
            (m) => m.ShopHistoryComponent
          ),
      },
      {
        path: 'history/booking',
        loadComponent: () =>
          import('./sections/booking-history/booking-history').then(
            (m) => m.BookingHistoryComponent
          ),
      },
      {
        path: 'business',
        loadComponent: () =>
          import('./sections/business-section/vendor-dashboard').then(
            (m) => m.VendorDashboardComponent
          ),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./sections/cart/cart').then((m) => m.CartComponent),
      },
    ],
  },
];

