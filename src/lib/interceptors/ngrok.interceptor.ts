import { HttpInterceptorFn } from '@angular/common/http';

export const ngrokSkipWarningInterceptor: HttpInterceptorFn = (req, next) => {
  const isNgrokUrl = req.url.includes('ngrok-free.dev');
  const isRelativeUrl = req.url.startsWith('/auth') || req.url.startsWith('/profile');

  if (isNgrokUrl || isRelativeUrl) {
    const clonedReq = req.clone({
      setHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
    return next(clonedReq);
  }

  return next(req);
};

