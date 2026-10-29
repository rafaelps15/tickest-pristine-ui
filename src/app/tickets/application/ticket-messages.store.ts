import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, of } from 'rxjs';
import { TicketMessage } from '../entities/ticket-message';
import { TicketMessageDataService } from '../infrastructure/ticket-message.data.service';
import { CursorPage, extractErrorMessage, valueOf } from '../../shared';

/** Página vazia, usada antes de um ticket ser definido. */
const EMPTY_PAGE: CursorPage<TicketMessage> = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

/**
 * Store das mensagens de um ticket: listagem paginada por cursor ("carregar mais"), publicação,
 * edição e exclusão. Publicar uma mensagem pode concluir a primeira resposta de SLA no back-end
 * (a primeira mensagem de quem não é o solicitante) — por isso quem chama {@link post} e tiver
 * sucesso deve também pedir ao `TicketDetailStore` pra atualizar o SLA (feito pelo componente, não
 * por esta Store — Stores desta arquitetura não injetam outras Stores do mesmo domínio; a
 * orquestração entre elas é sempre do componente, mesmo padrão já usado pro histórico do ticket).
 */
export const TicketMessagesStore = signalStore(
  { providedIn: 'root' },
  withState({
    ticketId: undefined as string | undefined,
    posting: false,
    postError: null as string | null,
    savingEdit: false,
    mutationError: null as string | null,
    deletingMessageId: null as string | null,
    /** Mensagens das páginas carregadas depois da primeira, na ordem em que chegaram. */
    olderMessages: [] as TicketMessage[],
    /** Última página carregada por "carregar mais" (nula enquanto só a primeira foi carregada). */
    lastPage: null as CursorPage<TicketMessage> | null,
    loadingMore: false,
    loadMoreError: null as string | null
  }),
  withProps(() => ({
    _ticketMessageDataService: inject(TicketMessageDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => params !== undefined
        ? store._ticketMessageDataService.getAll(params)
        : of(EMPTY_PAGE)
    })
  })),
  withComputed((store) => ({
    /** Mensagens já carregadas do ticket atual, da mais recente para a mais antiga (ordem aplicada pelo back-end). */
    messages: computed(() => [...(valueOf(store._listResource)?.items ?? []), ...store.olderMessages()]),
    /** Página de onde sai o cursor da próxima: a última carregada por "carregar mais" ou, antes disso, a primeira. */
    currentPage: computed(() => store.lastPage() ?? valueOf(store._listResource)),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {}, 'Erro ao carregar as mensagens') : null
      };
    })
  })),
  withComputed((store) => ({
    /** Indica se ainda há mensagens mais antigas para carregar. */
    hasMore: computed(() => store.currentPage()?.hasNextPage ?? false)
  })),
  withMethods((store) => {
    /** Volta para a primeira página: descarta as páginas acumuladas e recarrega o resource. */
    const reloadFirstPage = () => {
      patchState(store, { olderMessages: [], lastPage: null });
      store._listResource.reload();
    };

    return { _reloadFirstPage: reloadFirstPage };
  }),
  withMethods((store) => ({
    /** Define o ticket cujas mensagens devem ser carregadas, disparando o resource da primeira página. */
    loadForTicket(ticketId: string): void {
      if (store.ticketId() === ticketId) {
        store._reloadFirstPage();
        return;
      }
      patchState(store, { ticketId, olderMessages: [], lastPage: null });
    },

    /** Carrega a próxima página de mensagens (mais antigas) e acrescenta à lista já exibida. */
    loadMore(): void {
      const ticketId = store.ticketId();
      const page = store.currentPage();
      if (!ticketId || !page?.hasNextPage || !page.nextCursorDate || !page.nextCursorId || store.loadingMore()) return;

      patchState(store, { loadingMore: true, loadMoreError: null });

      store._ticketMessageDataService.getAll(ticketId, { cursorDate: page.nextCursorDate, cursorId: page.nextCursorId }).pipe(
        finalize(() => patchState(store, { loadingMore: false }))
      ).subscribe({
        next: (nextPage) => {
          patchState(store, {
            olderMessages: [...store.olderMessages(), ...nextPage.items],
            lastPage: nextPage
          });
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { loadMoreError: extractErrorMessage(err, {}, 'Erro ao carregar mais mensagens') });
        }
      });
    },

    /**
     * Publica uma nova mensagem e recarrega a primeira página em caso de sucesso. Publicar pode
     * concluir a primeira resposta de SLA — quem chama e tiver sucesso (`onSuccess`) deve também
     * atualizar o SLA via `TicketDetailStore.refreshSla()`, já que esta Store não injeta outra.
     */
    post(ticketId: string, content: string, onSuccess?: () => void): void {
      patchState(store, { posting: true, postError: null });

      store._ticketMessageDataService.post(ticketId, content).pipe(
        finalize(() => patchState(store, { posting: false }))
      ).subscribe({
        next: () => {
          store._reloadFirstPage();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            postError: extractErrorMessage(err, {
              403: 'Você não tem permissão para enviar mensagens neste chamado.',
              404: 'Chamado não encontrado — ele pode ter sido removido.'
            }, 'Erro ao enviar a mensagem.')
          });
        }
      });
    },

    /** Edita o conteúdo de uma mensagem já publicada e recarrega a primeira página em caso de sucesso — só o autor pode editar. */
    editMessage(messageId: string, content: string, onSuccess?: () => void): void {
      patchState(store, { savingEdit: true, mutationError: null });

      store._ticketMessageDataService.edit(messageId, content).pipe(
        finalize(() => patchState(store, { savingEdit: false }))
      ).subscribe({
        next: () => {
          store._reloadFirstPage();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você só pode editar as suas próprias mensagens.',
              404: 'Mensagem não encontrada — ela pode já ter sido excluída.'
            }, 'Erro ao editar a mensagem.')
          });
        }
      });
    },

    /** Exclui uma mensagem e recarrega a primeira página em caso de sucesso — quem a escreveu, ou quem administra chamados. */
    deleteMessage(messageId: string, onSuccess?: () => void): void {
      patchState(store, { deletingMessageId: messageId, mutationError: null });

      store._ticketMessageDataService.delete(messageId).pipe(
        finalize(() => patchState(store, { deletingMessageId: null }))
      ).subscribe({
        next: () => {
          store._reloadFirstPage();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para excluir esta mensagem.',
              404: 'Mensagem não encontrada — ela pode já ter sido excluída.'
            }, 'Erro ao excluir a mensagem.')
          });
        }
      });
    },

    /** Limpa o erro de publicação — ex.: ao digitar de novo depois de uma falha. */
    clearPostError(): void {
      patchState(store, { postError: null });
    },

    /** Limpa o erro de edição/exclusão de uma mensagem. */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    }
  }))
);
