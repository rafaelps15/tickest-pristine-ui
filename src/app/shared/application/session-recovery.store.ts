import { signalStore, withState, withProps, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionUnavailableReason } from '../entities/current-user';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';
import { LoginStore } from './login.store';

/**
 * Store da tela de sessão indisponível (A-42): a sessão existe, mas GET /users/me falhou por limite de
 * requisições, falta de conexão ou erro do servidor. Deixa tentar de novo sem perder a sessão, ou sair.
 */
export const SessionRecoveryStore = signalStore(
  withState({
    /** Motivo da última falha, mostrado na tela. */
    reason: 'server-error' as SessionUnavailableReason,
    /** Uma nova tentativa está em andamento. */
    retrying: false,
    /** Quantas tentativas pela tela já falharam; muda a mensagem anunciada a cada falha. */
    failedAttempts: 0
  }),
  withProps(() => ({
    /** Sessão atual: diz se há o que recuperar e é apagada quando a API a recusa. */
    _session: inject(SessionService),
    /** Nova tentativa de carregar o usuário logado (GET /users/me). */
    _currentUserService: inject(CurrentUserService),
    /** Store da sessão, que faz o logout de {@link signOut}. */
    _loginStore: inject(LoginStore),
    /** Router: volta à rota de origem ou vai pro login. */
    _router: inject(Router)
  })),
  withMethods((store) => ({
    /** Começa com o motivo que trouxe a pessoa à tela; sem sessão nenhuma, não há o que recuperar e vai pro login. */
    start(reason: SessionUnavailableReason): void {
      patchState(store, { reason, retrying: false, failedAttempts: 0 });
      if (!store._session.isAuthenticated()) {
        store._router.navigate(['/login']);
      }
    },

    /** Tenta carregar o usuário de novo: volta à rota de origem se der certo, vai pro login se a sessão for recusada. */
    retry(returnUrl: string): void {
      if (store.retrying()) return;
      patchState(store, { retrying: true });

      store._currentUserService.load().subscribe(result => {
        if (result.status === 'loaded') {
          patchState(store, { retrying: false });
          store._router.navigateByUrl(returnUrl);
          return;
        }

        if (result.status === 'unavailable') {
          patchState(store, { retrying: false, reason: result.reason, failedAttempts: store.failedAttempts() + 1 });
          return;
        }

        patchState(store, { retrying: false });
        store._session.clearSession();
        store._router.navigate(['/login']);
      });
    },

    /** Encerra a sessão (revoga no servidor quando dá) e volta ao login. */
    signOut(): void {
      store._loginStore.logout();
    }
  }))
);
