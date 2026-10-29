import { signalStore, withState, withProps, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { extractErrorMessage } from '../utils/http-error.util';

/** Código do erro (UserErrors.InvalidActivationToken) de link inexistente, expirado, já usado ou revogado — a API não distingue os casos de propósito. */
const INVALID_ACTIVATION_TOKEN = 'Users.InvalidActivationToken';

/**
 * Store da ativação de conta pelo convite (spec 008 do back-end): o usuário convidado define a
 * própria senha. Não abre sessão — a API responde 204 e a pessoa entra pelo login em seguida.
 */
export const ActivateAccountStore = signalStore(
  withState({
    loading: false,
    /** A senha foi definida e a conta está pronta pro login. */
    activated: false,
    /** O link não serve mais (expirado, usado, revogado) — a tela troca o formulário pela orientação de pedir outro convite. */
    invalidLink: false,
    /** Erro que não invalida o link (ex.: senha recusada pela política, servidor fora) — o formulário continua. */
    error: null as string | null
  }),
  withProps(() => ({
    _authDataService: inject(AuthDataService)
  })),
  withMethods((store) => ({
    /** Ativa a conta com o token do convite e a senha escolhida. */
    activate(token: string, newPassword: string): void {
      patchState(store, { loading: true, error: null });

      store._authDataService.activateAccount({ token, newPassword }).pipe(
        finalize(() => patchState(store, { loading: false }))
      ).subscribe({
        next: () => patchState(store, { activated: true }),
        error: (err: HttpErrorResponse) => {
          if (err.status === 400 && err.error?.title === INVALID_ACTIVATION_TOKEN) {
            patchState(store, { invalidLink: true });
            return;
          }

          patchState(store, {
            error: extractErrorMessage(err, {
              0: 'Sem conexão com o servidor. Tente de novo em instantes.',
              429: 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'
            }, 'Não foi possível ativar a conta agora. Tente de novo em instantes.')
          });
        }
      });
    },

    /** Marca o link como inválido sem chamar a API — usado quando a página abre sem token. */
    markInvalidLink(): void {
      patchState(store, { invalidLink: true });
    }
  }))
);
