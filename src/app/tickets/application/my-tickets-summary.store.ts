import { signalStore, withProps, withComputed, withMethods } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketStatus } from '../entities/ticket-status';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService } from '../../shared';

/**
 * Store do resumo dos chamados abertos pelo próprio usuário logado (GET /tickets/mine/summary),
 * pro bloco "Seus chamados" do Início — a resposta de "como estão os meus pedidos?" pra quem não
 * atende a fila. Não substitui o resumo da empresa ({@link TicketSummaryStore}), que continua igual
 * pra todo papel; só soma por status as contagens que a API devolve por status e prioridade.
 */
export const MyTicketsSummaryStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _sessionService: inject(SessionService)
  })),
  withProps((store) => ({
    /** Só busca com a permissão de ver os próprios chamados — sem ela, nem chama a API (evita um 403 certo). */
    _summaryResource: rxResource({
      params: () => (store._sessionService.hasPermission('tickets:view-own') ? true : undefined),
      stream: () => store._ticketDataService.getMineSummary()
    })
  })),
  withComputed((store) => {
    /** Soma as contagens dos status informados, ou `null` enquanto não há resposta (inclusive em erro). */
    const sum = (statuses: TicketStatus[]) => computed(() => {
      if (!store._summaryResource.hasValue()) return null;
      return store._summaryResource.value()
        .filter(group => statuses.includes(group.status))
        .reduce((total, group) => total + group.count, 0);
    });

    return {
      /** Chamados próprios aguardando atendimento. */
      openCount: sum([TicketStatus.Open]),
      /** Chamados próprios já em atendimento. */
      inProgressCount: sum([TicketStatus.InProgress]),
      /** Chamados próprios encerrados com solução (resolvidos ou fechados). */
      resolvedCount: sum([TicketStatus.Resolved, TicketStatus.Closed]),
      /** Chamados próprios só no status Resolvido (pra comparar com o mesmo número da empresa). */
      resolvedOnlyCount: sum([TicketStatus.Resolved]),
      /** Chamados próprios só no status Fechado (pra comparar com o mesmo número da empresa). */
      closedCount: sum([TicketStatus.Closed]),
      /** Chamados próprios do grupo "Em aberto" de Meus Chamados (Aberto e Em Andamento). */
      activeCount: sum([TicketStatus.Open, TicketStatus.InProgress]),
      /** Chamados próprios do grupo "Encerrados" de Meus Chamados (Resolvido, Fechado e Cancelado). */
      finishedCount: sum([TicketStatus.Resolved, TicketStatus.Closed, TicketStatus.Canceled]),
      /** Todos os chamados próprios, em qualquer status. */
      totalCount: sum([TicketStatus.Open, TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Closed, TicketStatus.Canceled]),
      /** O resumo está carregando. */
      loading: computed(() => store._summaryResource.isLoading()),
      /** O resumo falhou ao carregar. */
      failed: computed(() => !!store._summaryResource.error())
    };
  }),
  withMethods((store) => ({
    /** Busca o resumo de novo (ex.: "Tentar novamente"). */
    reload(): void {
      store._summaryResource.reload();
    }
  }))
);
