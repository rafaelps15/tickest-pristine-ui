import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from './session.service';
import { CurrentUserService } from './current-user.service';

/** Coordena a renovação do access token, evitando chamadas duplicadas de /refresh-token quando várias requisições expiram ao mesmo tempo. */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly authDataService = inject(AuthDataService);
  private readonly session = inject(SessionService);
  private readonly currentUserService = inject(CurrentUserService);

  private inFlight$: Observable<string | null> | null = null;

  /**
   * Retorna o novo access token, ou null se não houver refresh token ou o back-end recusar a renovação.
   * Falha de rede ou do servidor sai como erro, sem encerrar a sessão.
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
      // Só a recusa do refresh token encerra a sessão; sem resposta (status 0) ou erro 5xx, a falha é repassada.
      catchError((error: unknown) => isTransientFailure(error) ? throwError(() => error) : of(null)),
      finalize(() => { this.inFlight$ = null; }),
      shareReplay(1)
    );

    return this.inFlight$;
  }
}

/** Indica se o erro da renovação é passageiro (sem resposta do servidor ou erro 5xx), e não uma recusa do token. */
function isTransientFailure(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}
