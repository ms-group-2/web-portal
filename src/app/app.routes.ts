import { Routes } from '@angular/router';
import { authGuard } from 'lib/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'landing' },

  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing').then(m => m.Landing),
  },

  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
      {
        path: 'sign-in',
        loadComponent: () => import('./pages/auth/sign-in/sign-in').then(m => m.SignIn),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register').then(m => m.Register),
      },
      {
        path: 'verify',
        loadComponent: () => import('./pages/auth/verify/verify').then(m => m.Verify),
      },
      {
        path: 'google-callback',
        loadComponent: () =>
          import('./pages/auth/google-callback/google-callback').then(m => m.GoogleCallback),
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