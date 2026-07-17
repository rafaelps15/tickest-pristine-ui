import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Guard para rotas administrativas.
 *
 * O back-end não emite claims de papel/permissão no JWT (autorização é por permissão,
 * checada no servidor a cada requisição via [HasPermission]) — então aqui só validamos
 * autenticação. Uma ação sem a permissão necessária falha com 403 na API e o
 * authInterceptor já trata isso (limpa a sessão e redireciona para o login).
 */
export const adminMasterGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
