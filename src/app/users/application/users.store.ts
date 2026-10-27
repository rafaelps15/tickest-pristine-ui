import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, from, mergeMap, toArray, of, catchError, map, switchMap } from 'rxjs';
import { UserSummary } from '../entities/user-summary';
import { UserFilters } from '../entities/user-filters';
import { UpdateProfileRequest } from '../entities/user-profile';
import { UserDataService } from '../infrastructure/user.data.service';
import { AuthDataService, CreateUserData, extractErrorMessage } from '../../shared';

/** Filtros e paginação padrão: todos os status, primeira página, 20 itens por página. */
const DEFAULT_FILTERS: UserFilters = { status: 'All', page: 1, pageSize: 20 };

/** Máximo de desativações em lote em voo ao mesmo tempo — evita 100 requisições simultâneas ao selecionar "todos" com pageSize 100. */
const BULK_DEACTIVATE_CONCURRENCY = 10;

/** Store de usuários administrados: listagem paginada/filtrada, criação, edição, roles e ativação/desativação. */
export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState({
    filters: DEFAULT_FILTERS,
    loading: false,
    success: false,
    error: null as string | null,
    /** Id do último usuário criado — pra tela destacar a linha dele. */
    createdUserId: null as string | null,
    /** O último cadastro criou o usuário, mas a atribuição das funções escolhidas falhou. */
    createRolesFailed: false,
    listMutationError: null as string | null,
    profileError: null as string | null,
    rolesError: null as string | null,
    updatingProfile: false,
    assigningRoles: false,
    deactivatingIds: [] as string[],
    activatingIds: [] as string[],
    /** Usuários com reenvio de convite em andamento. */
    resendingInvitationIds: [] as string[]
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
    /**
     * Se a última carga da lista falhou — distinto de um erro de ação (desativar, reativar…), que
     * também aparece em {@link listState}: só a falha de carga se resolve recarregando.
     */
    listLoadFailed: computed(() => !!store._listResource.error()),
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
    /**
     * Reenvia o convite de ativação (o anterior deixa de valer). Falha vai pro erro da listagem:
     * a ação parte da linha ou do painel, fora de modal.
     */
    resendInvitation(userId: string, onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, resendingInvitationIds: [...store.resendingInvitationIds(), userId] });

      store._userDataService.resendInvitation(userId).pipe(
        finalize(() => patchState(store, { resendingInvitationIds: store.resendingInvitationIds().filter(id => id !== userId) }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          // 409 traz o motivo do back-end (limite de 5 em 24h, conta já ativada, usuário desativado) já em português.
          patchState(store, {
            listMutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para enviar convites.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.'
            }, 'Não foi possível reenviar o convite.')
          });
        }
      });
    },

    /**
     * Registra um novo usuário sem senha (POST /users/register): o back-end envia o convite por
     * e-mail e a própria pessoa define a senha (spec 008). Se
     * vierem funções, já as atribui com o id devolvido (PUT /users/{id}/roles) — o cadastro não
     * aceita funções direto. Se só a atribuição falhar, o usuário continua criado: é sucesso com
     * {@link createRolesFailed}, pra tela avisar como concluir em vez de sugerir criar de novo
     * (o que daria "e-mail já cadastrado").
     */
    createUser(data: CreateUserData, roleNames: string[] = []): void {
      patchState(store, { loading: true, success: false, error: null, createdUserId: null, createRolesFailed: false });

      store._authDataService.register(data).pipe(
        switchMap(userId => roleNames.length === 0
          ? of({ userId, rolesFailed: false })
          : store._userDataService.assignRoles(userId, roleNames).pipe(
              map(() => ({ userId, rolesFailed: false })),
              catchError(() => of({ userId, rolesFailed: true }))
            )),
        finalize(() => patchState(store, { loading: false }))
      ).subscribe({
        next: ({ userId, rolesFailed }) => {
          patchState(store, { success: true, createdUserId: userId, createRolesFailed: rolesFailed });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          // POST /users/register exige autenticação + a permissão de criar usuários — hoje não
          // existe cadastro público de verdade; quem chama esta tela sem estar autenticado como
          // administrador cai aqui com 401/403.
          const message = extractErrorMessage(err, {
            0: 'Sem conexão com o servidor.',
            401: 'Você não tem permissão para solicitar este cadastro.',
            403: 'Você não tem permissão para solicitar este cadastro.',
            409: 'Este e-mail já está cadastrado.'
          }, 'Ocorreu um erro inesperado.');
          patchState(store, { error: message });
        }
      });
    },

    /** Reseta o estado de criação (loading/success/error), usado ao reabrir o formulário. */
    resetState(): void {
      patchState(store, { loading: false, success: false, error: null, createdUserId: null, createRolesFailed: false });
    },

    /** Recarrega a página atual com os filtros atuais (GET /users, requer users:read). */
    loadAll(): void {
      patchState(store, { listMutationError: null });
      store._listResource.reload();
    },

    /** Limpa os erros dos modais de edição de cadastro e de atribuição de funções — chamado ao abrir um deles, pra não mostrar o erro de uma tentativa anterior. */
    clearDialogErrors(): void {
      patchState(store, { profileError: null, rolesError: null });
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

    /**
     * Substitui todos os filtros de uma vez, sem o efeito colateral de voltar pra página 1 que os
     * `set*` individuais têm — usado só pra restaurar o estado a partir da query string ao
     * inicializar a tela (recarregar/voltar/compartilhar o link precisa preservar a página exata).
     */
    hydrateFiltersFromUrl(filters: UserFilters): void {
      patchState(store, { filters });
    },

    /** Atualiza nome/sobrenome de um usuário (PUT /users/{userId}/profile) e recarrega a listagem em caso de sucesso; falha vai pra {@link profileError}, exibido dentro do próprio modal. */
    updateProfile(userId: string, data: UpdateProfileRequest, onSuccess?: () => void): void {
      patchState(store, { profileError: null, updatingProfile: true });

      store._userDataService.updateProfile(userId, data).pipe(
        finalize(() => patchState(store, { updatingProfile: false }))
      ).subscribe({
        next: () => {
          patchState(store, { profileError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            profileError: extractErrorMessage(err, {
              403: 'Você não tem permissão para editar o cadastro deste usuário.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.'
            }, 'Erro ao atualizar cadastro')
          });
        }
      });
    },

    /** Atribui um conjunto de roles a um usuário (PUT /users/{userId}/roles); falha vai pra {@link rolesError}, exibido dentro do próprio modal. */
    assignRoles(userId: string, roleNames: string[], onSuccess?: () => void): void {
      patchState(store, { rolesError: null, assigningRoles: true });

      store._userDataService.assignRoles(userId, roleNames).pipe(
        finalize(() => patchState(store, { assigningRoles: false }))
      ).subscribe({
        next: () => {
          patchState(store, { rolesError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            rolesError: extractErrorMessage(err, {
              403: 'Você não tem permissão para alterar as funções deste usuário.',
              404: 'Usuário não encontrado — a lista pode estar desatualizada.'
            }, 'Erro ao atribuir funções')
          });
        }
      });
    },

    /** Desativa um usuário (bloqueia o acesso ao sistema) e recarrega a listagem em caso de sucesso. */
    deactivate(userId: string, onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, deactivatingIds: [...store.deactivatingIds(), userId] });

      store._userDataService.deactivate(userId).pipe(
        finalize(() => patchState(store, { deactivatingIds: store.deactivatingIds().filter(id => id !== userId) }))
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

    /**
     * Desativa vários usuários em lote, com melhor esforço: cada chamada usa o mesmo endpoint
     * individual de desativação (não há endpoint de lote no back-end), no máximo
     * {@link BULK_DEACTIVATE_CONCURRENCY} em voo ao mesmo tempo — selecionar "todos" com
     * pageSize 100 não deve disparar 100 requisições simultâneas — e falhas de uma não cancelam
     * as demais. Reporta nomes dos que falharam no erro da listagem e recarrega só se pelo menos
     * um teve sucesso.
     */
    deactivateMany(userIds: string[], onDone?: (succeededCount: number, failedCount: number) => void): void {
      if (userIds.length === 0) return;

      patchState(store, { listMutationError: null, deactivatingIds: [...store.deactivatingIds(), ...userIds] });

      from(userIds).pipe(
        mergeMap(userId =>
          store._userDataService.deactivate(userId).pipe(
            map(() => ({ userId, ok: true as const })),
            catchError(() => of({ userId, ok: false as const }))
          ),
          BULK_DEACTIVATE_CONCURRENCY
        ),
        toArray(),
        finalize(() => patchState(store, {
          deactivatingIds: store.deactivatingIds().filter(id => !userIds.includes(id))
        }))
      ).subscribe(results => {
        const succeededIds = results.filter(result => result.ok).map(result => result.userId);
        const failedIds = results.filter(result => !result.ok).map(result => result.userId);

        if (failedIds.length > 0) {
          const failedNames = store.users()
            .filter(user => failedIds.includes(user.id))
            .map(user => `${user.firstName} ${user.lastName}`);
          patchState(store, {
            listMutationError: failedNames.length > 0
              ? `Não foi possível desativar: ${failedNames.join(', ')}.`
              : 'Não foi possível desativar um ou mais usuários selecionados.'
          });
        }

        if (succeededIds.length > 0) {
          store._listResource.reload();
        }

        onDone?.(succeededIds.length, failedIds.length);
      });
    },

    /** Reativa um usuário (libera o acesso de novo) e recarrega a listagem em caso de sucesso. */
    activate(userId: string, onSuccess?: () => void): void {
      patchState(store, { listMutationError: null, activatingIds: [...store.activatingIds(), userId] });

      store._userDataService.activate(userId).pipe(
        finalize(() => patchState(store, { activatingIds: store.activatingIds().filter(id => id !== userId) }))
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
