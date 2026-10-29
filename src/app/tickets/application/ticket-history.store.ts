import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, of } from 'rxjs';
import { TicketHistoryEntry } from '../entities/ticket-history';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { CursorPage, extractErrorMessage, valueOf } from '../../shared';

/** Página vazia, usada antes de um ticket ser definido. */
const EMPTY_PAGE: CursorPage<TicketHistoryEntry> = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

/**
 * Store do histórico de um ticket: listagem paginada por cursor ("carregar mais"), do mais
 * recente para o mais antigo. O resource traz a primeira página; as seguintes são acumuladas em
 * {@link olderEntries}. Somente leitura — os eventos são gerados como efeito de outras mutações
 * (reabrir, remover responsável etc.), não criados diretamente por esta tela.
 */
export const TicketHistoryStore = signalStore(
  { providedIn: 'root' },
  withState({
    ticketId: undefined as string | undefined,
    /** Eventos das páginas carregadas depois da primeira, na ordem em que chegaram. */
    olderEntries: [] as TicketHistoryEntry[],
    /** Última página carregada por "carregar mais" (nula enquanto só a primeira foi carregada). */
    lastPage: null as CursorPage<TicketHistoryEntry> | null,
    loadingMore: false,
    loadMoreError: null as string | null
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService)
  })),
  withProps((store) => ({
    _historyResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => params !== undefined
        ? store._ticketDataService.getHistory(params)
        : of(EMPTY_PAGE)
    })
  })),
  withComputed((store) => ({
    /** Eventos já carregados do ticket atual, do mais recente para o mais antigo (ordem aplicada pelo back-end). */
    entries: computed(() => [...(valueOf(store._historyResource)?.items ?? []), ...store.olderEntries()]),
    /** Página de onde sai o cursor da próxima: a última carregada por "carregar mais" ou, antes disso, a primeira. */
    currentPage: computed(() => store.lastPage() ?? valueOf(store._historyResource)),
    state: computed(() => {
      const resourceError = store._historyResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._historyResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {}, 'Erro ao carregar o histórico') : null
      };
    })
  })),
  withComputed((store) => ({
    /** Indica se ainda há eventos mais antigos para carregar. */
    hasMore: computed(() => store.currentPage()?.hasNextPage ?? false)
  })),
  withMethods((store) => {
    /** Volta para a primeira página: descarta as páginas acumuladas e recarrega o resource. */
    const reloadFirstPage = () => {
      patchState(store, { olderEntries: [], lastPage: null });
      store._historyResource.reload();
    };

    return { _reloadFirstPage: reloadFirstPage };
  }),
  withMethods((store) => ({
    /** Define o ticket cujo histórico deve ser carregado, disparando o resource da primeira página. */
    loadForTicket(ticketId: string): void {
      if (store.ticketId() === ticketId) {
        store._reloadFirstPage();
        return;
      }
      patchState(store, { ticketId, olderEntries: [], lastPage: null });
    },

    /** Recarrega a primeira página do histórico do ticket atual — ex.: depois de uma mutação que gera um novo evento. */
    reload(): void {
      store._reloadFirstPage();
    },

    /** Carrega a próxima página do histórico (mais antiga) e acrescenta à lista já exibida. */
    loadMore(): void {
      const ticketId = store.ticketId();
      const page = store.currentPage();
      if (!ticketId || !page?.hasNextPage || !page.nextCursorDate || !page.nextCursorId || store.loadingMore()) return;

      patchState(store, { loadingMore: true, loadMoreError: null });

      store._ticketDataService.getHistory(ticketId, { cursorDate: page.nextCursorDate, cursorId: page.nextCursorId }).pipe(
        finalize(() => patchState(store, { loadingMore: false }))
      ).subscribe({
        next: (nextPage) => {
          patchState(store, {
            olderEntries: [...store.olderEntries(), ...nextPage.items],
            lastPage: nextPage
          });
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { loadMoreError: extractErrorMessage(err, {}, 'Erro ao carregar mais eventos do histórico') });
        }
      });
    }
  }))
);
