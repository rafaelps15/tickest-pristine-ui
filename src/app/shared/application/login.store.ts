import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginCredentials } from '../entities/login-credentials';
import { AccessTokens } from '../entities/access-tokens';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';
import { extractErrorMessage } from '../utils/http-error.util';
import { sessionUnavailableUrlTree } from '../utils/session-unavailable.util';

/** Código do erro (UserErrors.PasswordChangeRequired) com que a API barra o login de uma senha provisória. */
const PASSWORD_CHANGE_REQUIRED = 'Users.PasswordChangeRequired';

/** Código do erro (UserErrors.PasswordChangeNotRequired) de quando não há troca de senha pendente. */
const PASSWORD_CHANGE_NOT_REQUIRED = 'Users.PasswordChangeNotRequired';

/** Verifica se o erro HTTP veio com o status e o código de erro de domínio (ProblemDetails.title) informados. */
function hasErrorCode(err: HttpErrorResponse, status: number, code: string): boolean {
  return err.status === status && err.error?.title === code;
}

/**
 * Store do ciclo de vida da sessão: login (guardando as credenciais só em memória quando a senha é provisória,
 * até a troca no primeiro acesso) e logout.
 */
export const LoginStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** Login ou troca da senha provisória em andamento, até o início da sessão terminar (usuário carregado ou desistência). */
    loading: false,
    /** Mensagem de falha mostrada no formulário, ou `null`. */
    error: null as string | null,
    /** Credenciais guardadas enquanto a troca da senha provisória não termina, ou `null`. */
    pendingCredentials: null as LoginCredentials | null
  }),
  withProps(() => ({
    /** Acesso HTTP ao login, à troca da senha provisória e ao logout. */
    _authDataService: inject(AuthDataService),
    /** Sessão onde os tokens do login são gravados e de onde o logout os apaga. */
    _session: inject(SessionService),
    /** Carga do usuário logado (GET /users/me), que fecha o início da sessão. */
    _currentUserService: inject(CurrentUserService),
    /** Router: leva ao dashboard, ao primeiro acesso, à sessão indisponível ou de volta ao login. */
    _router: inject(Router)
  })),
  withComputed((store) => ({
    /**
     * O início da sessão espera uma nova tentativa da primeira carga do usuário (GET /users/me falhou por rede,
     * 429 ou 5xx): o formulário avisa e o botão segue desabilitado.
     */
    retryingSession: computed(() => store.loading() && store._currentUserService.retryingFirstLoad())
  })),
  withMethods((store) => {
    /**
     * Salva os tokens, carrega o usuário logado e só então navega para o dashboard. Falha passageira vai pra
     * tela de sessão indisponível (a sessão acabou de ser criada e continua válida); recusa limpa a sessão e
     * fica no login com a mensagem. O `loading` só termina aqui, com o resultado da carga: durante as novas
     * tentativas, o botão não volta a aceitar envio.
     */
    const startSession = (tokens: AccessTokens): void => {
      store._session.saveSession(tokens);
      store._currentUserService.load().pipe(
        finalize(() => patchState(store, { loading: false }))
      ).subscribe(result => {
        if (result.status === 'loaded') {
          store._router.navigate(['/dashboard']);
          return;
        }

        if (result.status === 'unavailable') {
          store._router.navigateByUrl(sessionUnavailableUrlTree(store._router, result.reason, '/dashboard'));
          return;
        }

        store._session.clearSession();
        patchState(store, { error: 'Não foi possível carregar seus dados de acesso. Entre novamente.' });
      });
    };

    return {
      /**
       * Autentica com as credenciais informadas; com senha provisória, leva para a tela de primeiro acesso.
       * Ignora um novo envio enquanto o login ou o início da sessão ainda está em andamento, para não abrir
       * uma segunda sessão no servidor.
       */
      login(credentials: LoginCredentials): void {
        if (store.loading()) return;
        patchState(store, { loading: true, error: null, pendingCredentials: null });

        store._authDataService.login(credentials).subscribe({
          next: (tokens) => startSession(tokens),
          error: (err: HttpErrorResponse) => {
            patchState(store, { loading: false });

            if (hasErrorCode(err, 403, PASSWORD_CHANGE_REQUIRED)) {
              patchState(store, { pendingCredentials: credentials });
              store._router.navigate(['/primeiro-acesso']);
              return;
            }

            // Login responde 400 (UserErrors.InvalidCredentials) tanto para usuário
            // inexistente quanto para senha incorreta, para não vazar qual dos dois é o caso.
            // 403 (Users.LockedOut) já chega com sua própria mensagem via ProblemDetails.detail
            // (extractErrorMessage prioriza o corpo da API sobre este mapa). 429 vem do rate
            // limiter do ASP.NET sem corpo, por isso precisa de mensagem própria aqui.
            const message = extractErrorMessage(err, {
              400: 'E-mail ou senha incorretos.',
              429: 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
              500: 'Erro interno no servidor.'
            }, 'E-mail ou senha incorretos.');
            patchState(store, { error: message });
          }
        });
      },

      /**
       * Troca a senha provisória pela nova e, com sucesso, já inicia a sessão. Ignora um novo envio enquanto a
       * troca ou o início da sessão ainda está em andamento.
       */
      changeRequiredPassword(newPassword: string): void {
        if (store.loading()) return;
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
        }).subscribe({
          next: (tokens) => {
            patchState(store, { pendingCredentials: null });
            startSession(tokens);
          },
          error: (err: HttpErrorResponse) => {
            patchState(store, { loading: false });

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
      },

      /** Encerra a sessão: revoga o refresh token no servidor (se houver) e, com sucesso ou erro, limpa a sessão local e volta para o login. */
      logout(): void {
        const refreshToken = store._session.refreshToken();
        const finishLogout = () => {
          store._session.clearSession();
          store._router.navigate(['/login']);
        };

        if (!refreshToken) {
          finishLogout();
          return;
        }

        store._authDataService.logout(refreshToken).pipe(
          finalize(finishLogout)
        ).subscribe({
          error: () => {
            // De propósito: se o servidor não registrar a saída, a sessão local termina igual, no finalize.
          }
        });
      }
    };
  })
);
