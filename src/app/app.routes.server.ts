import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'shop/category/:categoryId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'shop/product/:productId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'business/dashboard/edit-product/:productId',
    renderMode: RenderMode.Server,
  },

  {
    path: 'business/**',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
