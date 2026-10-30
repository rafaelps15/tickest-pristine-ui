import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';
import { CurrentUserLoadResult } from '../entities/current-user';
import { sessionUnavailableUrlTree } from '../utils/session-unavailable.util';

/**
 * Guard para rotas autenticadas — garante o usuário logado (GET /users/me) carregado antes de liberar a rota, cobrindo o F5.
 * Sessão recusada vai pro login; falha passageira (429, 5xx, rede) vai pra tela de sessão indisponível, que deixa tentar de novo.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const currentUserService = inject(CurrentUserService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return currentUserService.ensureLoaded().pipe(
    map(result => result.status === 'loaded' ? true : redirectWhenUserNotLoaded(result, router, session, state.url))
  );
};

/**
 * Destino dos guards quando o usuário logado não carrega: falha passageira vai pra tela de sessão indisponível, com a
 * rota pedida; sessão recusada apaga os tokens salvos e vai pro login (como o `LoginStore` e o `SessionRecoveryStore`).
 */
export function redirectWhenUserNotLoaded(
  result: Exclude<CurrentUserLoadResult, { status: 'loaded' }>,
  router: Router,
  session: SessionService,
  returnUrl: string
): UrlTree {
  if (result.status === 'unavailable') return sessionUnavailableUrlTree(router, result.reason, returnUrl);
  session.clearSession();
  return router.createUrlTree(['/login']);
}
