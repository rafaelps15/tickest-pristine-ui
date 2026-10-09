import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { CreateTicketData, Ticket, UpdateTicketData } from '../entities/ticket';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService, extractErrorMessage } from '../../shared';

/** Tamanho padrão da página de "Meus Tickets", o mesmo padrão do back-end. */
export const TICKETS_PAGE_SIZE = 20;

/** Store de tickets do usuário logado: listagem paginada, criação, atualização, reabertura e exclusão. */
export const TicketsStore = signalStore(
  { providedIn: 'root' },
  withState({
    mutationError: null as string | null,
    page: 1,
    pageSize: TICKETS_PAGE_SIZE
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
        return userId ? { userId, page: store.page(), pageSize: store.pageSize() } : undefined;
      },
      stream: ({ params }) => store._ticketDataService.getMine(params.page, params.pageSize)
    })
  })),
  withComputed((store) => ({
    /** Página atual devolvida pela API (itens + dados de paginação). */
    ticketsPage: computed(() => store._listResource.value()),
    /** Tickets da página atual, do mais novo para o mais antigo. */
    tickets: computed(() => store._listResource.value()?.items ?? ([] as Ticket[])),
    /** Estado agregado da listagem: dados, carregamento e erro (de leitura ou de mutação). */
    state: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listResource.value()?.items ?? ([] as Ticket[]),
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar tickets')
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

    /** Carrega (ou recarrega) os tickets do usuário logado. */
    loadForCurrentUser(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /** Cria um novo ticket e recarrega a listagem na primeira página (onde o ticket novo aparece) em caso de sucesso. */
    create(data: CreateTicketData, onSuccess?: () => void): void {
      store._ticketDataService.create(data).subscribe({
        next: () => {
          patchState(store, { mutationError: null, page: 1 });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao abrir o ticket') });
        }
      });
    },

    /** Atualiza descrição/status de um ticket existente e recarrega a listagem em caso de sucesso. */
    update(ticketId: string, data: UpdateTicketData): void {
      store._ticketDataService.update(ticketId, data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao atualizar o ticket') });
        }
      });
    },

    /** Reabre um ticket inativo e recarrega a listagem em caso de sucesso. */
    reopen(ticketId: string): void {
      store._ticketDataService.reopen(ticketId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao reabrir o ticket') });
        }
      });
    },

    /**
     * Exclui (soft-delete) um ticket e recarrega a listagem em caso de sucesso. Se era o último item de uma
     * página que não é a primeira, volta uma página para a tela não ficar vazia.
     */
    remove(ticketId: string): void {
      store._ticketDataService.delete(ticketId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          if (store.tickets().length === 1 && store.page() > 1) {
            patchState(store, { page: store.page() - 1 });
          } else {
            store._listResource.reload();
          }
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao excluir o ticket') });
        }
      });
    }
  }))
);
