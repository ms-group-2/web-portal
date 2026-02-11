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
        path: 'orders',
        loadComponent: () =>
          import('./sections/orders/orders').then((m) => m.OrdersComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./sections/wishlist/wishlist').then((m) => m.WishlistComponent),
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./sections/payment-methods/payment-methods').then(
            (m) => m.PaymentMethodsComponent
          ),
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
    ],
  },
];

