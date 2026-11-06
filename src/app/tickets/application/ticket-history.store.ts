import { signalStore, withProps, withComputed, withMethods, withFeature } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { TicketHistoryEntry } from '../entities/ticket-history';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { withTicketCursorPages } from './ticket-cursor-pages';

/**
 * Store do histórico de um ticket: listagem paginada por cursor ("carregar mais", {@link withTicketCursorPages}),
 * do mais recente para o mais antigo. Somente leitura — os eventos são gerados como efeito de outras mutações
 * (reabrir, remover responsável etc.), não criados diretamente por esta tela.
 */
export const TicketHistoryStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    /** Acesso HTTP aos chamados (GET /tickets/{id}/history). */
    _ticketDataService: inject(TicketDataService)
  })),
  withFeature((store) => withTicketCursorPages<TicketHistoryEntry>(
    (...page) => store._ticketDataService.getHistory(...page),
    { readError: 'Erro ao carregar o histórico', loadMoreError: 'Erro ao carregar mais eventos do histórico' }
  )),
  withComputed((store) => ({
    /** Eventos já carregados do ticket atual, do mais recente para o mais antigo (ordem aplicada pelo back-end). */
    entries: computed(() => store._items()),
    /** Estado da leitura da primeira página: carregando e erro. */
    state: computed(() => store._listState())
  })),
  withMethods((store) => ({
    /** Define o ticket cujo histórico deve ser carregado, disparando o resource da primeira página. */
    loadForTicket(ticketId: string): void {
      store._loadTicket(ticketId);
    },

    /** Recarrega a primeira página do histórico do ticket atual — ex.: depois de uma mutação que gera um novo evento. */
    reload(): void {
      store._reloadFirstPage();
    }
  }))
);
