// import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { TokenManagementService } from 'lib/services/identity/token-management.service';

// export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
//   const tokens = inject(TokenManagementService);
//   const access = tokens.getAccessToken();

//   if (!access) return next(req);

//   return next(req.clone({ setHeaders: { Authorization: `Bearer ${access}` } }));
// };