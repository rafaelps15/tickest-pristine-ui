import { signalStore, withState, withProps, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginCredentials } from '../entities/login-credentials';
import { AccessTokens } from '../entities/access-tokens';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';
import { extractErrorMessage } from '../utils/http-error.util';

/** Código do erro (UserErrors.PasswordChangeRequired) com que a API barra o login de uma senha provisória. */
const PASSWORD_CHANGE_REQUIRED = 'Users.PasswordChangeRequired';

/** Código do erro (UserErrors.PasswordChangeNotRequired) de quando não há troca de senha pendente. */
const PASSWORD_CHANGE_NOT_REQUIRED = 'Users.PasswordChangeNotRequired';

/** Verifica se o erro HTTP veio com o status e o código de erro de domínio (ProblemDetails.title) informados. */
function hasErrorCode(err: HttpErrorResponse, status: number, code: string): boolean {
  return err.status === status && err.error?.title === code;
}

/**
 * Store do fluxo de login: autentica e, quando a senha é provisória, guarda as credenciais só em memória até a
 * troca no primeiro acesso.
 */
export const LoginStore = signalStore(
  { providedIn: 'root' },
  withState({
    loading: false,
    error: null as string | null,
    pendingCredentials: null as LoginCredentials | null
  }),
  withProps(() => ({
    _authDataService: inject(AuthDataService),
    _session: inject(SessionService),
    _currentUserService: inject(CurrentUserService),
    _router: inject(Router)
  })),
  withMethods((store) => {
    /** Salva os tokens, carrega o usuário logado e só então navega para o dashboard. */
    const startSession = (tokens: AccessTokens): void => {
      store._session.saveSession(tokens);
      store._currentUserService.load().subscribe(() => {
        store._router.navigate(['/dashboard']);
      });
    };

    return {
      /** Autentica com as credenciais informadas; com senha provisória, leva para a tela de primeiro acesso. */
      login(credentials: LoginCredentials): void {
        patchState(store, { loading: true, error: null, pendingCredentials: null });

        store._authDataService.login(credentials).pipe(
          finalize(() => patchState(store, { loading: false }))
        ).subscribe({
          next: (tokens) => startSession(tokens),
          error: (err: HttpErrorResponse) => {
            if (hasErrorCode(err, 403, PASSWORD_CHANGE_REQUIRED)) {
              patchState(store, { pendingCredentials: credentials });
              store._router.navigate(['/primeiro-acesso']);
              return;
            }

            // Login responde 400 (UserErrors.InvalidCredentials) tanto para usuário
            // inexistente quanto para senha incorreta, para não vazar qual dos dois é o caso.
            const message = extractErrorMessage(err, {
              400: 'E-mail ou senha incorretos.',
              500: 'Erro interno no servidor.'
            }, 'E-mail ou senha incorretos.');
            patchState(store, { error: message });
          }
        });
      },

      /** Troca a senha provisória pela nova e, com sucesso, já inicia a sessão. */
      changeRequiredPassword(newPassword: string): void {
        const pending = store.pendingCredentials();

        if (!pending) {
          store._router.navigate(['/login']);
          return;
        }

        patchState(store, { loading: true, error: null });

        store._authDataService.changeRequiredPassword({
          email: pending.email,
          currentPassword: pending.password,
          newPassword
        }).pipe(
          finalize(() => patchState(store, { loading: false }))
        ).subscribe({
          next: (tokens) => {
            patchState(store, { pendingCredentials: null });
            startSession(tokens);
          },
          error: (err: HttpErrorResponse) => {
            if (hasErrorCode(err, 409, PASSWORD_CHANGE_NOT_REQUIRED)) {
              patchState(store, {
                pendingCredentials: null,
                error: 'Sua senha já foi definida. Entre com a nova senha.'
              });
              store._router.navigate(['/login']);
              return;
            }

            patchState(store, { error: extractErrorMessage(err, { 500: 'Erro interno no servidor.' }) });
          }
        });
      },

      /** Desiste da troca de senha: descarta as credenciais guardadas e volta para o login. */
      cancelPasswordChange(): void {
        patchState(store, { pendingCredentials: null, error: null });
        store._router.navigate(['/login']);
      }
    };
  })
);
