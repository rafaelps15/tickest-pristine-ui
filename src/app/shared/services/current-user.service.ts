import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, map, retry, shareReplay } from 'rxjs/operators';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from './session.service';
import { isTransientHttpError } from '../utils/http-error.util';
import { transientFailureReason } from '../utils/session-unavailable.util';
import { isAccountDeactivated } from '../utils/account-deactivated.util';
import { CurrentUserLoadResult } from '../entities/current-user';

/**
 * Esperas entre as novas tentativas de GET /users/me numa falha passageira (rede, 429 ou 5xx): cerca de
 * 15s no total. O limite global do back-end é por usuário e por minuto, sem `Retry-After`.
 */
const CURRENT_USER_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];

/** Carrega o usuário logado (GET /users/me) e mantém a sessão atualizada, evitando chamadas duplicadas simultâneas. */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  /** Chamada de GET /users/me. */
  private readonly authDataService = inject(AuthDataService);
  /** Sessão onde o usuário carregado é gravado. */
  private readonly session = inject(SessionService);

  /** Carregamento em andamento, compartilhado por quem pedir ao mesmo tempo; `null` quando não há. */
  private inFlight$: Observable<CurrentUserLoadResult> | null = null;

  /** Uma falha passageira já aconteceu e o carregamento está esperando ou fazendo uma nova tentativa. */
  private readonly retryingSignal = signal(false);
  /**
   * Nova tentativa da primeira carga: ainda não há usuário na sessão, então a navegação espera por ela e o
   * shell mostra o aviso. Numa recarga de fundo (interceptor ou renovação do token), com o usuário já
   * carregado, fica falso.
   */
  readonly retryingFirstLoad = computed(() => this.retryingSignal() && !this.session.currentUser());

  /**
   * Busca o usuário logado e grava na sessão. Falha passageira (rede, 429, 5xx) tenta de novo antes de
   * desistir e, se continuar, devolve `unavailable` com o motivo: a sessão pode seguir válida, então
   * não é tratada como recusa. Qualquer outra falha (401 e afins, ou erro que não é passageiro) devolve `unauthenticated`,
   * com `reason: 'deactivated'` quando a recusa é da conta desativada (403 `Users.Deactivated`).
   */
  load(): Observable<CurrentUserLoadResult> {
    if (this.inFlight$) {
      return this.inFlight$;
    }

    this.inFlight$ = this.authDataService.getCurrentUser().pipe(
      retry({
        count: CURRENT_USER_RETRY_DELAYS_MS.length,
        delay: (error: unknown, attempt: number) => {
          if (!isTransientHttpError(error)) return throwError(() => error);
          this.retryingSignal.set(true);
          return timer(CURRENT_USER_RETRY_DELAYS_MS[attempt - 1]);
        }
      }),
      map((user): CurrentUserLoadResult => {
        this.session.setCurrentUser(user);
        return { status: 'loaded' };
      }),
      catchError((error: unknown) => {
        const reason = transientFailureReason(error);
        if (reason) return of<CurrentUserLoadResult>({ status: 'unavailable', reason });

        return of<CurrentUserLoadResult>(isAccountDeactivated(error)
          ? { status: 'unauthenticated', reason: 'deactivated' }
          : { status: 'unauthenticated' });
      }),
      finalize(() => {
        this.inFlight$ = null;
        this.retryingSignal.set(false);
      }),
      shareReplay(1)
    );

    return this.inFlight$;
  }

  /** Garante que o usuário logado já foi carregado — devolve `loaded` na hora se já houver, senão carrega agora. */
  ensureLoaded(): Observable<CurrentUserLoadResult> {
    if (this.session.currentUser()) {
      return of({ status: 'loaded' });
    }

    return this.load();
  }
}
