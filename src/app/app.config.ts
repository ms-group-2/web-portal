import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { ngrokSkipWarningInterceptor } from 'lib/interceptors/ngrok.interceptor';
import { jwtInterceptor } from 'lib/interceptors/jwt.interceptor';
import { spinnerInterceptor } from 'lib/interceptors/spinner.interceptor';

import { AuthService } from 'lib/services/identity/auth.service';
import { TokenManagementService } from 'lib/services/identity/token-management.service';
import { firstValueFrom } from 'rxjs';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';


function initAuth(auth: AuthService, tokens: TokenManagementService) {
  return async () => {
    console.log('[initAuth] isAuthenticated =', tokens.isAuthenticated());

    if (!tokens.isAuthenticated()) return;

    try {
      const u = await firstValueFrom(auth.me());
      console.log('[initAuth] /auth/me returned:', u);
      auth.user.set(u);
    } catch (err) {
      console.error('[initAuth] /auth/me failed:', err);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(withInterceptors([ngrokSkipWarningInterceptor, jwtInterceptor, spinnerInterceptor])),
    provideAnimations(),

    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService, TokenManagementService],
      multi: true,
    }, provideClientHydration(withEventReplay()),
  ],
};
