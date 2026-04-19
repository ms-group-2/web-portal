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
    ],
  },
];
