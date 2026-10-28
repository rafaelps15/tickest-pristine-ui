import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';
import { TicketSlaStatus } from './ticket-sla-status';

/**
 * Recorte de chamados a contar em GET /tickets — o mesmo filtro da listagem do Monitor, sem
 * paginação nem ordenação. A contagem vem do `totalCount` que o servidor calcula com esses
 * filtros (e com a permissão de quem chama), nunca de itens de uma página.
 */
export interface TicketCountQuery {
  /** Status aceitos (vazio ou ausente = todos). O back-end aceita o parâmetro repetido. */
  statuses?: TicketStatus[];
  /** Uma prioridade só. */
  priority?: TicketPriority;
  /** Um setor só. */
  sectorId?: string;
  /** Situação do SLA (no prazo, em risco, atrasado, cumprido, resolvido com atraso, sem SLA). */
  slaStatus?: TicketSlaStatus;
  /** Só chamados sem responsável; exclusivo com `assignedToUserId`. */
  unassignedOnly?: boolean;
  /** Só chamados com este responsável. */
  assignedToUserId?: string;
}
