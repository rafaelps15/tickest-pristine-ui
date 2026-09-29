import { signalStore, withState, withProps, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginCredentials } from '../entities/login-credentials';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from '../services/session.service';
import { extractErrorMessage } from '../utils/http-error.util';

/** Store da tela de login: autentica e inicia a sessão em caso de sucesso. */
export const LoginStore = signalStore(
  { providedIn: 'root' },
  withState({ loading: false, error: null as string | null }),
  withProps(() => ({
    _authDataService: inject(AuthDataService),
    _session: inject(SessionService),
    _router: inject(Router)
  })),
  withMethods((store) => ({
    /** Autentica com as credenciais informadas e, se bem-sucedido, navega para o dashboard. */
    login(credentials: LoginCredentials): void {
      patchState(store, { loading: true, error: null });

      store._authDataService.login(credentials).pipe(
        finalize(() => patchState(store, { loading: false }))
      ).subscribe({
        next: (tokens) => {
          store._session.saveSession(tokens);
          store._router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          // Login responde 404 (UserErrors.NotFoundByEmail) tanto para usuário
          // inexistente quanto para senha incorreta, para não vazar qual dos dois é o caso.
          const message = extractErrorMessage(err, {
            404: 'E-mail ou senha incorretos.',
            500: 'Erro interno no servidor.'
          }, 'E-mail ou senha incorretos.');
          patchState(store, { error: message });
        }
      });
    }
  }))
);
