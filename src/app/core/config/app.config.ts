import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

import { routes } from '../routes/app.routes';
import { PermissionRepository } from '../../domain/interfaces/permission.repository';
import { PermissionHttpRepository } from '../../infrastructure/repositories/permission-http.repository';
import { RoleRepository } from '../../domain/interfaces/role.repository';
import { RoleHttpRepository } from '../../infrastructure/repositories/role-http.repository';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { UserHttpRepository } from '../../infrastructure/repositories/user-http.repository';
import { AuthRepository } from '../../domain/interfaces/auth.repository';
import { AuthHttpRepository } from '../../infrastructure/repositories/auth-http.repository';
import { TicketRepository } from '../../domain/interfaces/ticket.repository';
import { TicketHttpRepository } from '../../infrastructure/repositories/ticket-http.repository';
import { DepartmentRepository } from '../../domain/interfaces/department.repository';
import { DepartmentHttpRepository } from '../../infrastructure/repositories/department-http.repository';
import { SectorRepository } from '../../domain/interfaces/sector.repository';
import { SectorHttpRepository } from '../../infrastructure/repositories/sector-http.repository';
import { authInterceptor } from '../interceptors/auth.interceptor';

/** Configuração global da aplicação. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withNoIncrementalHydration()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(),
      withInterceptors([authInterceptor])
    ),
    { provide: PermissionRepository, useClass: PermissionHttpRepository },
    { provide: RoleRepository, useClass: RoleHttpRepository },
    { provide: UserRepository, useClass: UserHttpRepository },
    { provide: AuthRepository, useClass: AuthHttpRepository },
    { provide: TicketRepository, useClass: TicketHttpRepository },
    { provide: DepartmentRepository, useClass: DepartmentHttpRepository },
    { provide: SectorRepository, useClass: SectorHttpRepository }
  ]
};
