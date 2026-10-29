import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CreateTicketData, Ticket, UpdateTicketData } from '../entities/ticket';
import { TicketStatusGroup } from '../entities/ticket-status-group';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService, extractErrorMessage } from '../../shared';

/** Tamanho padrão da página de "Meus Tickets", o mesmo padrão do back-end. */
export const TICKETS_PAGE_SIZE = 20;

/** Store de tickets do usuário logado: listagem paginada, criação, atualização e reabertura. */
export const TicketsStore = signalStore(
  { providedIn: 'root' },
  withState({
    mutationError: null as string | null,
    page: 1,
    pageSize: TICKETS_PAGE_SIZE,
    /** Grupo de status filtrado ("Em aberto" por padrão; null = todos). */
    statusGroup: TicketStatusGroup.Active as TicketStatusGroup | null,
    /** Trecho do título buscado (vazio = sem busca). */
    search: '',
    /** Ids de tickets com edição, cancelamento ou reabertura em andamento — trava o botão da linha e evita duplo-envio. */
    pendingTicketIds: [] as string[],
    /** Criação de ticket em andamento — trava o botão de envio e evita duplo-envio. */
    creating: false
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _session: inject(SessionService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      // O id não vai na requisição (a API usa o do token); fica nos params só para esperar o login e recarregar
      // quando outro usuário entrar.
      params: () => {
        const userId = store._session.userId();
        return userId
          ? { userId, page: store.page(), pageSize: store.pageSize(), statusGroup: store.statusGroup(), search: store.search() }
          : undefined;
      },
      stream: ({ params }) => store._ticketDataService.getMine(params.page, params.pageSize, params.statusGroup, params.search)
    })
  })),
  withProps((store) => ({
    /**
     * Sondagem "a pessoa tem algum chamado?", só quando a lista filtrada voltou vazia: separa o
     * primeiro uso (nenhum chamado em lugar nenhum) do "nada pendente"/"nada encontrado". Uma linha
     * só, sem filtro; sem lista vazia filtrada, não faz requisição.
     */
    _anyTicketResource: rxResource({
      params: () => {
        const userId = store._session.userId();
        // hasValue() antes de value(): ler o valor de um resource em erro lança exceção.
        const page = store._listResource.hasValue() ? store._listResource.value() : undefined;
        const filtered = store.statusGroup() !== null || store.search().trim() !== '';
        return userId && page && page.totalCount === 0 && filtered ? { userId } : undefined;
      },
      stream: () => store._ticketDataService.getMine(1, 1)
    })
  })),
  withComputed((store) => ({
    /** Página atual devolvida pela API, ou undefined enquanto carrega ou em erro (hasValue() evita a exceção de value()). */
    _listPage: computed(() => store._listResource.hasValue() ? store._listResource.value() : undefined),
    /** Resposta da sondagem "tem algum chamado?", ou undefined enquanto não houver. */
    _anyTicketPage: computed(() => store._anyTicketResource.hasValue() ? store._anyTicketResource.value() : undefined)
  })),
  withComputed((store) => ({
    /** Página atual devolvida pela API (itens + dados de paginação). */
    ticketsPage: computed(() => store._listPage()),
    /** Tickets da página atual, do que teve atividade mais recente para o mais antigo. */
    tickets: computed(() => store._listPage()?.items ?? ([] as Ticket[])),
    /** Indica se algum filtro (grupo diferente de "todos" ou busca) está aplicado. */
    isFiltered: computed(() => store.statusGroup() !== null || store.search().trim() !== ''),
    /**
     * Se a pessoa tem algum chamado, filtrado ou não: `true` com a lista não vazia; com a lista
     * filtrada vazia, a resposta da sondagem; `null` enquanto ainda não dá pra saber.
     */
    hasAnyTicket: computed((): boolean | null => {
      const page = store._listPage();
      if (!page) return null;
      if (page.totalCount > 0) return true;
      if (store.statusGroup() === null && store.search().trim() === '') return false;
      // Sondagem em erro: assume que há chamados, pra mostrar o vazio do filtro (que tem saída) em vez de carregar pra sempre.
      if (store._anyTicketResource.error()) return true;
      const probe = store._anyTicketPage();
      return probe ? probe.totalCount > 0 : null;
    }),
    /** Erro só da leitura da listagem (sem os erros de mutação) — o único que "Tentar novamente" resolve. */
    loadError: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return resourceError ? extractErrorMessage(resourceError, {}, 'Erro ao carregar chamados') : null;
    }),
    /** Estado agregado da listagem: dados, carregamento e erro (de leitura ou de mutação). */
    state: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listPage()?.items ?? ([] as Ticket[]),
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar chamados')
          : null)
      };
    })
  })),
  withComputed((store) => ({
    /** Página atual (1-based). */
    currentPage: computed(() => store.ticketsPage()?.page ?? store.page()),
    /** Itens por página efetivamente aplicados pela API. */
    currentPageSize: computed(() => store.ticketsPage()?.pageSize ?? store.pageSize()),
    /** Total de tickets do usuário logado (todas as páginas). */
    total: computed(() => store.ticketsPage()?.totalCount ?? 0),
    /** Total de páginas disponíveis. */
    totalPages: computed(() => store.ticketsPage()?.totalPages ?? 0),
    /** Indica se existe uma página anterior à atual. */
    hasPreviousPage: computed(() => store.ticketsPage()?.hasPreviousPage ?? false),
    /** Indica se existe uma página seguinte à atual. */
    hasNextPage: computed(() => store.ticketsPage()?.hasNextPage ?? false)
  })),
  withMethods((store) => ({
    /** Vai para a página informada (ignora páginas fora do intervalo). */
    goToPage(page: number): void {
      const totalPages = store.totalPages();
      if (page < 1 || (totalPages > 0 && page > totalPages)) return;
      patchState(store, { page });
    },

    /** Troca o tamanho da página e volta para a primeira. */
    setPageSize(pageSize: number): void {
      patchState(store, { pageSize, page: 1 });
    },

    /** Filtra por grupo de status (null = todos) e volta para a primeira página. */
    setStatusGroup(statusGroup: TicketStatusGroup | null): void {
      if (statusGroup === store.statusGroup()) return;
      patchState(store, { statusGroup, page: 1 });
    },

    /** Busca pelo trecho do título (vazio = sem busca) e volta para a primeira página. */
    setSearch(search: string): void {
      const term = search.trim();
      if (term === store.search()) return;
      patchState(store, { search: term, page: 1 });
    },

    /** Descarta a mensagem de erro da última mutação (editar, cancelar ou reabrir). */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    },

    /** Carrega (ou recarrega) os tickets do usuário logado. */
    loadForCurrentUser(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /**
     * Cria um novo ticket e recarrega a listagem na primeira página (onde o ticket novo aparece) em caso de
     * sucesso. Marca `creating` durante a chamada, pra travar o botão de envio e evitar duplo-envio.
     */
    create(data: CreateTicketData, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, creating: true });

      store._ticketDataService.create(data).pipe(
        finalize(() => patchState(store, { creating: false }))
      ).subscribe({
        next: () => {
          patchState(store, { page: 1 });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao abrir o chamado') });
        }
      });
    },

    /**
     * Atualiza a descrição e/ou o status de um ticket ativo (editar o texto, ou cancelar) e
     * recarrega a listagem em caso de sucesso. Marca o id como pendente durante a chamada, pra
     * travar os botões da linha e evitar duplo-envio.
     */
    update(ticketId: string, data: UpdateTicketData, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, pendingTicketIds: [...store.pendingTicketIds(), ticketId] });

      store._ticketDataService.update(ticketId, data).pipe(
        finalize(() => patchState(store, {
          pendingTicketIds: store.pendingTicketIds().filter(id => id !== ticketId)
        }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para atualizar este chamado.',
              404: 'Chamado não encontrado — ele pode ter sido removido.',
              409: 'Não foi possível atualizar o chamado — tente novamente.'
            }, 'Erro ao atualizar o chamado')
          });
        }
      });
    },

    /**
     * Reabre um ticket inativo, com o motivo opcional (o back-end o grava como mensagem de quem
     * reabriu, na mesma transação), e recarrega a listagem em caso de sucesso. Marca o id como
     * pendente durante a chamada, pra travar o botão da linha e evitar duplo-envio.
     */
    reopen(ticketId: string, reason: string | null, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, pendingTicketIds: [...store.pendingTicketIds(), ticketId] });

      store._ticketDataService.reopen(ticketId, reason).pipe(
        finalize(() => patchState(store, {
          pendingTicketIds: store.pendingTicketIds().filter(id => id !== ticketId)
        }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao reabrir o chamado') });
        }
      });
    }
  }))
);
