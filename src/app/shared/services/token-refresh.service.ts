import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from './session.service';
import { CurrentUserService } from './current-user.service';
import { isTransientHttpError } from '../utils/http-error.util';

/** Coordena a renovação do access token, evitando chamadas duplicadas de /refresh-token quando várias requisições expiram ao mesmo tempo. */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  /** Chamada de POST /users/refresh-token. */
  private readonly authDataService = inject(AuthDataService);
  /** Sessão onde os tokens renovados são gravados. */
  private readonly session = inject(SessionService);
  /** Recarrega o usuário logado depois da renovação. */
  private readonly currentUserService = inject(CurrentUserService);

  /** Renovação em andamento, compartilhada pelas requisições que vencem juntas; `null` quando não há. */
  private inFlight$: Observable<string | null> | null = null;

  /**
   * Retorna o novo access token, ou null se não houver refresh token ou o back-end recusar a renovação.
   * Falha passageira (rede, 429 ou 5xx) sai como erro, sem encerrar a sessão.
   */
  refresh(): Observable<string | null> {
    if (this.inFlight$) {
      return this.inFlight$;
    }

    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return of(null);
    }

    this.inFlight$ = this.authDataService.refresh(refreshToken).pipe(
      map(tokens => {
        this.session.saveSession(tokens);
        // Só inscreve, sem encadear: se /users/me desse 401, esperaria a própria renovação que acabou de terminar.
        this.currentUserService.load().subscribe();
        return tokens.accessToken;
      }),
      // Só a recusa do refresh token encerra a sessão; sem resposta, 429 ou 5xx, a falha é repassada.
      catchError((error: unknown) => isTransientHttpError(error) ? throwError(() => error) : of(null)),
      finalize(() => { this.inFlight$ = null; }),
      shareReplay(1)
    );

    return this.inFlight$;
  }
}
