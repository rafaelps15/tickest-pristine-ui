import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { UserSummary } from '../entities/user-summary';
import { UserDataService } from '../infrastructure/user.data.service';
import { AuthDataService, CreateUserData, extractErrorMessage } from '../../shared';

/** Store de usuários administrados: listagem, criação (via registro) e atribuição de roles. */
export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState({
    loading: false,
    success: false,
    error: null as string | null,
    listMutationError: null as string | null
  }),
  withProps(() => ({
    _userDataService: inject(UserDataService),
    _authDataService: inject(AuthDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({ stream: () => store._userDataService.getAll() })
  })),
  withComputed((store) => ({
    users: computed(() => store._listResource.value() ?? []),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listResource.value() ?? ([] as UserSummary[]),
        loading: store._listResource.isLoading(),
        error: store.listMutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar usuários')
          : null)
      };
    })
  })),
  withMethods((store) => ({
    /** Registra um novo usuário (único caminho de criação exposto pelo back-end: POST /users/register). */
    createUser(data: CreateUserData): void {
      patchState(store, { loading: true, success: false, error: null });

      store._authDataService.register(data).pipe(
        finalize(() => patchState(store, { loading: false }))
      ).subscribe({
        next: () => {
          patchState(store, { success: true });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          const message = extractErrorMessage(err, {
            0: 'Sem conexão com o servidor.',
            409: 'Este e-mail já está cadastrado.'
          }, 'Ocorreu um erro inesperado.');
          patchState(store, { error: message });
        }
      });
    },

    /** Reseta o estado de criação (loading/success/error), usado ao reabrir o formulário. */
    resetState(): void {
      patchState(store, { loading: false, success: false, error: null });
    },

    /** Carrega todos os usuários cadastrados (GET /users, requer users:manage). */
    loadAll(): void {
      patchState(store, { listMutationError: null });
      store._listResource.reload();
    },

    /** Atribui um conjunto de roles a um usuário (PUT /users/{userId}/roles). */
    assignRoles(userId: string, roleIds: string[], onSuccess?: () => void): void {
      store._userDataService.assignRoles(userId, roleIds).subscribe({
        next: () => {
          patchState(store, { listMutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { listMutationError: extractErrorMessage(err, {}, 'Erro ao atribuir funções') });
        }
      });
    }
  }))
);
