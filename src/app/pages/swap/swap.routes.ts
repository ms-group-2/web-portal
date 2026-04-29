import { Routes } from '@angular/router';
import { authGuard } from 'lib/guards/auth.guard';

export const swapRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./swap-layout').then((m) => m.SwapLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./swap').then((m) => m.Swap),
      },
      {
        path: 'create',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/post-swap/post-swap').then((m) => m.PostSwap),
      },
      {
        path: 'propose/:listingId',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/propose-swap/propose-swap').then((m) => m.ProposeSwap),
      },
      {
        path: 'edit/:listingId',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/edit-swap/edit-swap').then((m) => m.EditSwap),
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/swap-detail/swap-detail').then((m) => m.SwapDetail),
      },
    ],
  },
];
