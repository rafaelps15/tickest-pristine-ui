import { TicketDashboardScope } from '../entities/ticket-dashboard';
import { TicketStatsQuery } from '../entities/ticket-stats-query';

/**
 * Leva o recorte do Início aos filtros da API, sem o período (cada leitura aplica o período a uma
 * data diferente): setores, prioridade e responsável. "Meus" vira o id de quem está logado (lido só
 * nesse caso); sem ele, null — o recorte não tem como ter chamados e nada é pedido. É a mesma para o
 * agregado (`TicketDashboardStore`) e para os Alertas de SLA (`TicketSummaryStore`), pra os dois
 * pedirem sempre os mesmos chamados.
 */
export function dashboardScopeFilters(scope: TicketDashboardScope, userId: () => string | null | undefined): TicketStatsQuery | null {
  const filters: TicketStatsQuery = { sectorIds: scope.sectorIds, priority: scope.priority };
  if (scope.assignee === 'none') return { ...filters, unassignedOnly: true };
  if (scope.assignee === 'me') {
    const id = userId();
    return id ? { ...filters, assignedToUserId: id } : null;
  }
  return scope.assignedToUserId ? { ...filters, assignedToUserId: scope.assignedToUserId } : filters;
}

/**
 * Se dois recortes pedem exatamente os mesmos chamados, campo a campo (setores ausentes e lista vazia
 * são o mesmo; a ordem dos setores vem estável da barra). Os dois Stores do Início usam esta, pra um
 * recorte igual não refazer as buscas em nenhum deles.
 */
export function sameDashboardScope(a: TicketDashboardScope, b: TicketDashboardScope): boolean {
  return a.priority === b.priority && a.assignee === b.assignee && a.assignedToUserId === b.assignedToUserId
    && a.from === b.from && a.to === b.to && (a.sectorIds ?? []).join() === (b.sectorIds ?? []).join();
}
