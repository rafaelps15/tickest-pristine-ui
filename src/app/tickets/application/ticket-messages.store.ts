import { signalStore, withState, withProps, withComputed, withMethods, withFeature, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TicketMessage } from '../entities/ticket-message';
import { TicketMessageDataService } from '../infrastructure/ticket-message.data.service';
import { withTicketCursorPages } from './ticket-cursor-pages';
import { extractErrorMessage } from '../../shared';

/**
 * Store das mensagens de um ticket: listagem paginada por cursor ("carregar mais",
 * {@link withTicketCursorPages}), publicação, edição e exclusão. Publicar uma mensagem pode concluir a primeira resposta de SLA no back-end
 * (a primeira mensagem de quem não é o solicitante) — por isso quem chama {@link post} e tiver
 * sucesso deve também pedir ao `TicketDetailStore` pra atualizar o SLA (feito pelo componente, não
 * por esta Store — Stores desta arquitetura não injetam outras Stores do mesmo domínio; a
 * orquestração entre elas é sempre do componente, mesmo padrão já usado pro histórico do ticket).
 */
export const TicketMessagesStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** Publicação de mensagem em andamento. */
    posting: false,
    /** Falha da última publicação de mensagem. */
    postError: null as string | null,
    /** Edição de mensagem em andamento. */
    savingEdit: false,
    /** Falha da última edição ou exclusão de mensagem. */
    mutationError: null as string | null,
    /** Id da mensagem com exclusão em andamento, ou `null`. */
    deletingMessageId: null as string | null
  }),
  withProps(() => ({
    /** Acesso HTTP às mensagens (listagem, publicação, edição e exclusão). */
    _ticketMessageDataService: inject(TicketMessageDataService)
  })),
  withFeature((store) => withTicketCursorPages<TicketMessage>(
    (...page) => store._ticketMessageDataService.getAll(...page),
    { readError: 'Erro ao carregar as mensagens', loadMoreError: 'Erro ao carregar mais mensagens' }
  )),
  withComputed((store) => ({
    /** Mensagens já carregadas do ticket atual, da mais recente para a mais antiga (ordem aplicada pelo back-end). */
    messages: computed(() => store._items()),
    /** Estado da leitura da primeira página: carregando e erro. */
    listState: computed(() => store._listState())
  })),
  withMethods((store) => ({
    /** Define o ticket cujas mensagens devem ser carregadas, disparando o resource da primeira página. */
    loadForTicket(ticketId: string): void {
      store._loadTicket(ticketId);
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

    /** Limpa o erro de edição/exclusão de uma mensagem. */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    }
  }))
);
