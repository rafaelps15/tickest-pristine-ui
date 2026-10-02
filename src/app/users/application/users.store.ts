import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { UserSummary } from '../entities/user-summary';
import { UserFilters } from '../entities/user-filters';
import { UpdateProfileRequest } from '../entities/user-profile';
import { UserDataService } from '../infrastructure/user.data.service';
import { AuthDataService, CreateUserData, extractErrorMessage } from '../../shared';

/** Filtros e paginação padrão: todos os status, primeira página, 20 itens por página. */
const DEFAULT_FILTERS: UserFilters = { status: 'All', page: 1, pageSize: 20 };

/** Store de usuários administrados: listagem paginada/filtrada, criação, edição, roles e ativação/desativação. */
export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState({
    filters: DEFAULT_FILTERS,
    loading: false,
    success: false,
    error: null as string | null,
    listMutationError: null as string | null,
    updatingProfile: false,
    assigningRoles: false,
    deactivating: false,
    activating: false
  }),
  withProps(() => ({
    _userDataService: inject(UserDataService),
    _authDataService: inject(AuthDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => store.filters(),
      stream: ({ params }) => store._userDataService.getAll(params)
    })
  })),
  withComputed((store) => ({
    /** Página atual devolvida pela API (itens + dados de paginação). */
    usersPage: computed(() => store._listResource.value()),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: store.listMutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar usuários')
          : null)
      };
    })
  })),
  withComputed((store) => ({
    /** Usuários da página atual, com as funções de cada um ordenadas alfabeticamente para exibição consistente na tela. */
    users: computed(() => (store.usersPage()?.items ?? []).map(user => ({
      ...user,
      roles: [...user.roles].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }))),
    /** Página atual (1-based). */
    currentPage: computed(() => store.usersPage()?.page ?? store.filters().page),
    /** Itens por página efetivamente aplicados pela API. */
    pageSize: computed(() => store.usersPage()?.pageSize ?? store.filters().pageSize),
    /** Total de usuários que batem com os filtros atuais (todas as páginas). */
    total: computed(() => store.usersPage()?.totalCount ?? 0),
    /** Total de páginas disponíveis com os filtros atuais. */
    totalPages: computed(() => store.usersPage()?.totalPages ?? 0),
    /** Indica se existe uma página anterior à atual. */
    hasPreviousPage: computed(() => store.usersPage()?.hasPreviousPage ?? false),
    /** Indica se existe uma página seguinte à atual. */
    hasNextPage: computed(() => store.usersPage()?.hasNextPage ?? false)
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

    /** Recarrega a página atual com os filtros atuais (GET /users, requer users:read). */
    loadAll(): void {
      patchState(store, { listMutationError: null });
      store._listResource.reload();
    },

    /** Limpa o erro de mutação da listagem — chamado ao abrir um modal, pra não mostrar o erro de uma ação/usuário anterior. */
    clearListMutationError(): void {
      patchState(store, { listMutationError: null });
    },

    /** Muda o termo de busca e volta para a primeira página. */
    setSearch(search: string): void {
      patchState(store, { filters: { ...store.filters(), search: search || undefined, page: 1 } });
    },

    /** Muda o filtro de status (Todos/Ativos/Inativos) e volta para a primeira página. */
    setStatus(status: UserFilters['status']): void {
      patchState(store, { filters: { ...store.filters(), status, page: 1 } });
    },

    /** Muda o período de cadastro (aaaa-mm-dd) e volta para a primeira página. */
    setPeriod(createdFrom: string | undefined, createdTo: string | undefined): void {
      patchState(store, { filters: { ...store.filters(), createdFrom, createdTo, page: 1 } });
    },

    /** Navega para a página informada. */
    goToPage(page: number): void {
      patchState(store, { filters: { ...store.filters(), page } });
    },

    /** Muda a quantidade de itens por página e volta para a primeira página (a página atual pode não existir mais com o novo tamanho). */
    setPageSize(pageSize: number): void {
      patchState(store, { filters: { ...store.filters(), pageSize, page: 1 } });
    },

    /** Limpa todos os filtros, voltando ao estado padrão (todos os status, primeira página, 20 por página). */
    clearFilters(): void {
      patchState(store, { filters: DEFAULT_FILTERS });
    },

    /** Atualiza nome/sobrenome de um usuário (PUT /users/{userId}/profile) e recarrega a listagem em caso de sucesso. */
    updateProfile(userId: string, data: UpdateProfileRequest, onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, updatingProfile: true });

      store._userDataService.updateProfile(userId, data).pipe(
        finalize(() => patchState(store, { updatingProfile: false }))
      ).subscribe({
        next: () => {
          patchState(store, { listMutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            listMutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para editar o cadastro deste usuário.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.'
            }, 'Erro ao atualizar cadastro')
          });
        }
      });
    },

    /** Atribui um conjunto de roles a um usuário (PUT /users/{userId}/roles). */
    assignRoles(userId: string, roleIds: string[], onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, assigningRoles: true });

      store._userDataService.assignRoles(userId, roleIds).pipe(
        finalize(() => patchState(store, { assigningRoles: false }))
      ).subscribe({
        next: () => {
          patchState(store, { listMutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            listMutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para alterar as funções deste usuário.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.'
            }, 'Erro ao atribuir funções')
          });
        }
      });
    },

    /** Desativa um usuário (bloqueia o login dele) e recarrega a listagem em caso de sucesso. */
    deactivate(userId: string, onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, deactivating: true });

      store._userDataService.deactivate(userId).pipe(
        finalize(() => patchState(store, { deactivating: false }))
      ).subscribe({
        next: () => {
          patchState(store, { listMutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            listMutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para desativar usuários.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.',
              409: 'Este usuário já está desativado.'
            }, 'Erro ao desativar usuário')
          });
        }
      });
    },

    /** Reativa um usuário (libera o login dele de novo) e recarrega a listagem em caso de sucesso. */
    activate(userId: string, onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, activating: true });

      store._userDataService.activate(userId).pipe(
        finalize(() => patchState(store, { activating: false }))
      ).subscribe({
        next: () => {
          patchState(store, { listMutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            listMutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para reativar usuários.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.',
              409: 'Este usuário já está ativo.'
            }, 'Erro ao reativar usuário')
          });
        }
      });
    }
  }))
);
