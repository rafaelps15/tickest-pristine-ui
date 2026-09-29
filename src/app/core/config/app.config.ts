import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

import { routes } from '../routes/app.routes';
import { authInterceptor } from '../../shared/interceptors/auth.interceptor';

/** Configuração global da aplicação. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withNoIncrementalHydration()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(),
      withInterceptors([authInterceptor])
    )
  ]
};
