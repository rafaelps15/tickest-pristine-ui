import { computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { patchState, signalStoreFeature, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { Observable, finalize, of } from 'rxjs';
import { CursorPage, HttpErrorStatusMessages, PageCursor, extractErrorMessage, valueOf } from '../../shared';

/**
 * Busca de uma página da listagem de um chamado: só com o id, a primeira; com o cursor da página anterior, a
 * seguinte. Quem passa repassa os argumentos como vieram (`(...page) => dataService.getAll(...page)`).
 */
export type TicketPageFetch<T> = (...page: [ticketId: string, cursor?: PageCursor]) => Observable<CursorPage<T>>;

/** Mensagens das falhas da listagem, as de cada Store. */
export interface TicketCursorPagesMessages {
  /** Texto genérico da falha ao ler a primeira página. */
  readError: string;
  /** Frases da falha da primeira página por status HTTP (ex.: o 403 dos anexos). */
  readStatusMessages?: HttpErrorStatusMessages;
  /** Texto da falha do "carregar mais". */
  loadMoreError: string;
}

/**
 * Listagem de um chamado paginada por cursor ("carregar mais"), do mais novo para o mais antigo: o resource traz
 * a primeira página do chamado em `ticketId`, e `loadMore` acumula as seguintes. É a mesma nas Stores de anexos,
 * mensagens e histórico, cada uma com a própria busca e as próprias mensagens de falha. Expõe `_items` (tudo o
 * que já foi carregado), `_listState` (carregando e erro da primeira página), `_loadTicket` e `_reloadFirstPage`
 * para a Store que a usa (por `withFeature`, para a busca ler o Data Service dela).
 */
export function withTicketCursorPages<T>(fetchPage: TicketPageFetch<T>, messages: TicketCursorPagesMessages) {
  /** Página vazia, usada antes de um chamado ser definido. */
  const emptyPage: CursorPage<T> = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

  return signalStoreFeature(
    withState({
      ticketId: undefined as string | undefined,
      /** Itens das páginas carregadas depois da primeira, na ordem em que chegaram. */
      _olderItems: [] as T[],
      /** Última página carregada por "carregar mais" (nula enquanto só a primeira foi carregada). */
      _lastPage: null as CursorPage<T> | null,
      loadingMore: false,
      /** Falha do último "carregar mais", que é de leitura: não se mistura aos erros das ações. */
      loadMoreError: null as string | null
    }),
    withProps((store) => ({
      /** Primeira página do chamado atual. */
      _listResource: rxResource({
        params: () => store.ticketId(),
        stream: ({ params }) => params !== undefined ? fetchPage(params) : of(emptyPage)
      })
    })),
    withComputed((store) => ({
      /** Itens já carregados do chamado atual, da primeira página e das seguintes (ordem aplicada pelo back-end). */
      _items: computed(() => [...(valueOf(store._listResource)?.items ?? []), ...store._olderItems()]),
      /** Página de onde sai o cursor da próxima: a última carregada por "carregar mais" ou, antes disso, a primeira. */
      _currentPage: computed(() => store._lastPage() ?? valueOf(store._listResource)),
      /** Estado da leitura da primeira página: carregando e o erro da leitura, sem os erros das ações. */
      _listState: computed(() => {
        const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
        return {
          loading: store._listResource.isLoading(),
          error: resourceError ? extractErrorMessage(resourceError, messages.readStatusMessages, messages.readError) : null
        };
      })
    })),
    withComputed((store) => ({
      /** Indica se ainda há itens mais antigos para carregar. */
      hasMore: computed(() => store._currentPage()?.hasNextPage ?? false)
    })),
    withMethods((store) => ({
      /** Volta para a primeira página: descarta as páginas acumuladas e recarrega o resource. */
      _reloadFirstPage(): void {
        patchState(store, { _olderItems: [], _lastPage: null });
        store._listResource.reload();
      }
    })),
    withMethods((store) => ({
      /** Define o chamado da listagem: o mesmo de agora recarrega a primeira página; outro dispara o resource dele. */
      _loadTicket(ticketId: string): void {
        if (store.ticketId() === ticketId) {
          store._reloadFirstPage();
          return;
        }
        patchState(store, { ticketId, _olderItems: [], _lastPage: null });
      },

      /** Carrega a próxima página (mais antiga) e acrescenta à lista já exibida. */
      loadMore(): void {
        const ticketId = store.ticketId();
        const page = store._currentPage();
        if (!ticketId || !page?.hasNextPage || !page.nextCursorDate || !page.nextCursorId || store.loadingMore()) return;

        patchState(store, { loadingMore: true, loadMoreError: null });

        fetchPage(ticketId, { cursorDate: page.nextCursorDate, cursorId: page.nextCursorId }).pipe(
          finalize(() => patchState(store, { loadingMore: false }))
        ).subscribe({
          next: (nextPage) => {
            patchState(store, {
              _olderItems: [...store._olderItems(), ...nextPage.items],
              _lastPage: nextPage
            });
          },
          error: (err: HttpErrorResponse) => {
            patchState(store, { loadMoreError: extractErrorMessage(err, {}, messages.loadMoreError) });
          }
        });
      }
    }))
  );
}
