import { Routes } from '@angular/router';
import { authGuard, guestGuard } from 'lib/guards/auth.guard';
import { vendorGuard } from 'lib/guards/vendor.guard';
import { businessRegisterGuard } from 'lib/guards/business-register.guard';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'landing' },

  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing').then(m => m.Landing),
  },

  {
    path: 'swap',
    loadChildren: () => import('./pages/swap/swap.routes').then(m => m.swapRoutes),
  },

  {
    path: 'booking',
    loadComponent: () => import('./pages/booking/booking').then(m => m.Booking),
  },

  {
    path: 'shop',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/shop/shop').then(m => m.Shop),
      },
      {
        path: 'category/:categoryId',
        loadComponent: () => import('./pages/category-products/category-products').then(m => m.CategoryProducts),
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/shop/search/search').then(m => m.ShopSearch),
      },
      {
        path: 'product/:productId',
        loadComponent: () => import('./pages/product-detail/product-detail').then(m => m.ProductDetail),
      }
    ]
  },

  {
    path: 'auth',
    children: [
      {
        path: 'sign-in',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/sign-in/sign-in').then(m => m.SignIn),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/register/register').then(m => m.Register),
      },
      {
        path: 'verify',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/verify/verify').then(m => m.Verify),
      },
      {
        path: 'google-callback',
        loadComponent: () =>
          import('./pages/auth/google-callback/google-callback').then(m => m.GoogleCallback),
      },
      {
      path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
      },
      {
        path: 'reset-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/auth/reset-password/reset-password').then(m => m.ResetPassword),
      },

    ],
  },

  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/home-layout/home-layout').then(m => m.HomeLayout),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
    ],
  },

  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/profile/profile.routes').then(m => m.profileRoutes),
  },

  {
    path: 'business',
    canActivate: [authGuard],
    children: [
      {
        path: 'register',
        canActivate: [businessRegisterGuard],
        loadComponent: () => import('./pages/business-registration/business-registration').then(m => m.BusinessRegistrationComponent),
      },
      {
        path: 'dashboard',
        canActivate: [vendorGuard],
        loadChildren: () => import('./pages/vendor-dashboard/vendor-dashboard.routes').then(m => m.vendorDashboardRoutes),
      }
    ]
  },

  {
    path: 'user/:id',
    loadComponent: () => import('./pages/user-profile/user-profile').then(m => m.UserProfile),
  },

  { path: '**', redirectTo: 'landing' },
];