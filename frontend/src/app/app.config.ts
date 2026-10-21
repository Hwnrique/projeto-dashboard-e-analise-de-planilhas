import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(),
    provideAppInitializer(() => {
      const platformId = inject(PLATFORM_ID);

      if (!isPlatformBrowser(platformId)) {
        return;
      }

      const authService = inject(AuthService);

      return firstValueFrom(authService.restoreSession().pipe(catchError(() => of(null))));
    }),
  ],
};
