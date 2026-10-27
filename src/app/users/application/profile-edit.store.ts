import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, of } from 'rxjs';
import { ChangePasswordRequest, UpdateProfileRequest } from '../entities/user-profile';
import { UserDataService } from '../infrastructure/user.data.service';
import { extractErrorMessage, SessionService, CurrentUserService, valueOf } from '../../shared';

/** Store da edição de perfil: carrega o perfil de um usuário e salva nome/sobrenome. */
export const ProfileEditStore = signalStore(
  { providedIn: 'root' },
  withState({
    userId: undefined as string | undefined,
    saving: false,
    saved: false,
    mutationError: null as string | null,
    changingPassword: false,
    passwordChanged: false,
    passwordError: null as string | null
  }),
  withProps(() => ({
    _userDataService: inject(UserDataService),
    _session: inject(SessionService),
    _currentUserService: inject(CurrentUserService)
  })),
  withProps((store) => ({
    _profileResource: rxResource({
      params: () => store.userId(),
      stream: ({ params }) => params !== undefined
        ? store._userDataService.getById(params)
        : of(undefined)
    })
  })),
  withComputed((store) => ({
    /** Perfil em edição, carregado pelo resource de leitura. */
    profile: computed(() => valueOf(store._profileResource)),
    /** Indica se o perfil está sendo carregado. */
    loading: computed(() => store._profileResource.isLoading()),
    /** Mensagem de erro do carregamento do perfil, se houver. */
    loadError: computed(() => {
      const error = store._profileResource.error() as HttpErrorResponse | undefined;
      return error ? extractErrorMessage(error, {}, 'Erro ao carregar o perfil.') : null;
    })
  })),
  withMethods((store) => ({
    /** Carrega o perfil do usuário logado (id da claim `sub` do JWT), disparando o resource. */
    loadCurrentUser(): void {
      const userId = store._session.userId() ?? undefined;
      patchState(store, { userId, saved: false, mutationError: null });
    },

    /** Salva nome e sobrenome do usuário carregado e recarrega o perfil em caso de sucesso. */
    save(request: UpdateProfileRequest): void {
      const userId = store.userId();
      if (!userId) return;

      patchState(store, { saving: true, saved: false, mutationError: null });

      store._userDataService.updateProfile(userId, request).pipe(
        finalize(() => patchState(store, { saving: false }))
      ).subscribe({
        next: () => {
          patchState(store, { saved: true });
          store._profileResource.reload();
          store._currentUserService.load().subscribe();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para editar este perfil.',
              404: 'Usuário não encontrado.'
            }, 'Erro ao salvar o perfil.')
          });
        }
      });
    },

    /** Altera a senha do usuário logado; sucesso revoga as demais sessões no back-end. */
    changePassword(request: ChangePasswordRequest): void {
      patchState(store, { changingPassword: true, passwordChanged: false, passwordError: null });

      store._userDataService.changePassword(request).pipe(
        finalize(() => patchState(store, { changingPassword: false }))
      ).subscribe({
        next: () => patchState(store, { passwordChanged: true }),
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            passwordError: extractErrorMessage(err, {
              429: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
            }, 'Erro ao alterar a senha.')
          });
        }
      });
    },

    /** Esconde a confirmação de "perfil atualizado" — usado quando o usuário volta a editar o formulário. */
    clearSaved(): void {
      patchState(store, { saved: false });
    },

    /** Esconde a confirmação de "senha alterada" — usado quando o usuário volta a editar o formulário de senha. */
    clearPasswordChanged(): void {
      patchState(store, { passwordChanged: false });
    }
  }))
);
