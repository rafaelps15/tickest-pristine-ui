import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from './session.service';

/** Carrega o usuário logado (GET /users/me) e mantém a sessão atualizada, evitando chamadas duplicadas simultâneas. */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly authDataService = inject(AuthDataService);
  private readonly session = inject(SessionService);

  private inFlight$: Observable<boolean> | null = null;

  /** Busca o usuário logado e grava na sessão; devolve true em caso de sucesso, false em caso de erro. */
  load(): Observable<boolean> {
    if (this.inFlight$) {
      return this.inFlight$;
    }

    this.inFlight$ = this.authDataService.getCurrentUser().pipe(
      map(user => {
        this.session.setCurrentUser(user);
        return true;
      }),
      catchError(() => of(false)),
      finalize(() => { this.inFlight$ = null; }),
      shareReplay(1)
    );

    return this.inFlight$;
  }

  /** Garante que o usuário logado já foi carregado — devolve true na hora se já houver, senão carrega agora. */
  ensureLoaded(): Observable<boolean> {
    if (this.session.currentUser()) {
      return of(true);
    }

    return this.load();
  }
}
