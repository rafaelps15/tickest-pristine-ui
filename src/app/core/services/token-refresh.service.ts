import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { AuthRepository } from '../../domain/interfaces/auth.repository';
import { SessionService } from './session.service';

/** Coordena a renovação do access token, evitando chamadas duplicadas de /refresh-token quando várias requisições expiram ao mesmo tempo. */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly repository = inject(AuthRepository);
  private readonly session = inject(SessionService);

  private inFlight$: Observable<string | null> | null = null;

  /** Retorna o novo access token, ou null se não houver refresh token ou a renovação falhar. */
  refresh(): Observable<string | null> {
    if (this.inFlight$) {
      return this.inFlight$;
    }

    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return of(null);
    }

    this.inFlight$ = this.repository.refresh(refreshToken).pipe(
      map(result => {
        if (!result.isSuccess) {
          return null;
        }
        this.session.saveSession(result.value);
        return result.value.accessToken;
      }),
      catchError(() => of(null)),
      finalize(() => { this.inFlight$ = null; }),
      shareReplay(1)
    );

    return this.inFlight$;
  }
}
