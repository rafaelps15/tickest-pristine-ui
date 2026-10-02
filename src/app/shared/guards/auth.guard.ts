import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';

/** Guard para rotas autenticadas — garante o usuário logado (GET /users/me) carregado antes de liberar a rota, cobrindo o F5. */
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const currentUserService = inject(CurrentUserService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return currentUserService.ensureLoaded().pipe(
    map(loaded => loaded ? true : router.createUrlTree(['/login']))
  );
};
