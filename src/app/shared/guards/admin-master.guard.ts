import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Guard para rotas administrativas.
 *
 * A rota deve declarar a permissão exigida em `data.requiredPermission` (código
 * igual ao usado pelo back-end em `[HasPermission]`, ex. `"users:manage"`).
 * O JWT já carrega a claim `permissions` do usuário (ver SessionService), então
 * aqui validamos autenticação e a posse da permissão antes de liberar a rota —
 * sem isso, o usuário só descobria via 403 da API depois de já estar na tela.
 */
export const adminMasterGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const requiredPermission = route.data['requiredPermission'] as string | undefined;

  if (requiredPermission && !session.hasPermission(requiredPermission)) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
