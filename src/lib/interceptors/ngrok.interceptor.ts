import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

const OLD_NGROK_HOSTS = [
  'https://armory-monsieur-zigzagged.ngrok-free.dev',
  'https://melia-unhelped-selena.ngrok-free.dev',
];

function rewriteUrls(body: unknown): unknown {
  if (typeof body === 'string') {
    let result = body;
    for (const old of OLD_NGROK_HOSTS) {
      result = result.replaceAll(old, environment.apiBaseUrl);
    }
    return result;
  }
  if (Array.isArray(body)) return body.map(rewriteUrls);
  if (body && typeof body === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      out[k] = rewriteUrls(v);
    }
    return out;
  }
  return body;
}

export const ngrokSkipWarningInterceptor: HttpInterceptorFn = (req, next) => {
  const isNgrokUrl = req.url.includes('ngrok-free.dev');
  const isRelativeUrl = req.url.startsWith('/auth') || req.url.startsWith('/profile');

  const request = (isNgrokUrl || isRelativeUrl)
    ? req.clone({ setHeaders: { 'ngrok-skip-browser-warning': 'true' } })
    : req;

  return next(request).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({ body: rewriteUrls(event.body) });
      }
      return event;
    }),
  );
};

