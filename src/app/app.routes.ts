import { Routes } from '@angular/router';
import { authGuard, guestGuard } from 'lib/guards/auth.guard';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'landing' },

  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing').then(m => m.Landing),
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

  { path: '**', redirectTo: 'landing' },
];