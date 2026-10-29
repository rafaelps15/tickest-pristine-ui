import { signalStore, withProps, withComputed, withMethods } from '@ngrx/signals';
import { inject, computed, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketStatus } from '../entities/ticket-status';
import { OwnTicketCount } from '../entities/own-ticket-count';
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
    /**
     * Só busca com a permissão de ver os próprios chamados — sem ela, nem chama a API (evita um 403
     * certo). O parâmetro é o id de quem está logado: o store é da raiz e sobrevive ao logout (a troca de
     * conta não recarrega a página), então outra pessoa entrando refaz a busca em vez de herdar a resposta.
     */
    _summaryResource: rxResource({
      params: () => (store._sessionService.hasPermission('tickets:view-own') ? store._sessionService.userId() ?? undefined : undefined),
      stream: () => store._ticketDataService.getMineSummary()
    })
  })),
  withComputed((store) => {
    /**
     * Último resumo bom de quem está logado: numa recarga o resource já mantém o valor, e numa
     * atualização que falha os números anteriores continuam (o erro fica em `stale`). Trocar de usuário
     * (ou sair) zera: os números de uma sessão nunca aparecem pra outra. Null antes da primeira resposta.
     */
    const shown = linkedSignal<{ userId: string | null; value: OwnTicketCount[] | null }, OwnTicketCount[] | null>({
      source: () => ({
        userId: store._sessionService.userId(),
        value: store._summaryResource.hasValue() ? store._summaryResource.value() : null
      }),
      computation: (current, previous) =>
        current.value ?? (previous && previous.source.userId === current.userId ? previous.value : null)
    });
    /** Soma as contagens dos status informados, ou `null` enquanto não há nenhuma resposta. */
    const sum = (statuses: TicketStatus[]) => computed(() => {
      const groups = shown();
      if (!groups) return null;
      return groups
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
      /** Primeira carga, sem nenhum número ainda (numa recarga, os números ficam: ver {@link busy}). */
      loading: computed(() => store._summaryResource.isLoading() && shown() === null),
      /** Buscando o resumo, na primeira carga ou numa recarga. */
      busy: computed(() => store._summaryResource.isLoading()),
      /** O resumo falhou e não há números anteriores pra mostrar. */
      failed: computed(() => !!store._summaryResource.error() && shown() === null),
      /** A última atualização falhou, mas os números anteriores continuam na tela (velhos). */
      stale: computed(() => !!store._summaryResource.error() && shown() !== null)
    };
  }),
  withMethods((store) => ({
    /** Busca o resumo de novo (ex.: "Tentar novamente"). */
    reload(): void {
      store._summaryResource.reload();
    }
  }))
);
