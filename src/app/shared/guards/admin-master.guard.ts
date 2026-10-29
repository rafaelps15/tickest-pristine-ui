import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';

/**
 * Guard para rotas administrativas.
 *
 * A rota deve declarar a permissão exigida em `data.requiredPermission` (código
 * igual ao usado pelo back-end em `[HasPermission]`, ex. `"users:read"`), ou uma lista
 * de códigos quando qualquer um deles basta (ex. `["departments:manage", "sectors:manage"]`).
 * As permissões vêm de GET /users/me (ver CurrentUserService/SessionService), por isso
 * aqui garantimos que o usuário logado já foi carregado antes de checar a permissão —
 * sem isso, o usuário só descobria via 403 da API depois de já estar na tela.
 */
export const adminMasterGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionService);
  const currentUserService = inject(CurrentUserService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const requiredPermission = route.data['requiredPermission'] as string | string[] | undefined;
  const acceptedPermissions = requiredPermission === undefined ? [] : [requiredPermission].flat();

  return currentUserService.ensureLoaded().pipe(
    map(() => {
      if (acceptedPermissions.length > 0 && !acceptedPermissions.some(code => session.hasPermission(code))) {
        return router.createUrlTree(['/dashboard']);
      }
      return true;
    })
  );
};
