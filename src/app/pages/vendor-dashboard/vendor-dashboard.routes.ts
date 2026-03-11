import { Routes } from '@angular/router';
import { vendorGuard } from 'lib/guards/vendor.guard';

export const vendorDashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./vendor-dashboard').then(m => m.VendorDashboard),
  },
  {
    path: 'add-product',
    canActivate: [vendorGuard],
    loadComponent: () => import('./pages/add-product/add-product').then(m => m.AddProduct),
  },
  {
    path: 'edit-product/:productId',
    canActivate: [vendorGuard],
    loadComponent: () => import('./pages/edit-product/edit-product').then(m => m.EditProduct),
  },
];
