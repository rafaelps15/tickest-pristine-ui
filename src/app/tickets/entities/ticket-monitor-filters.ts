import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';
import { TicketSlaStatus } from './ticket-sla-status';
import { TicketSortOrder } from './ticket-sort-order';

/** Filtros e paginação da listagem de "Monitorar Tickets" (GET /tickets). */
export interface TicketMonitorFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  sectorId?: string;
  slaStatus?: TicketSlaStatus;
  search?: string;
  /** Mostra só chamados sem responsável atribuído. */
  unassignedOnly?: boolean;
  /** Mostra só chamados atribuídos a este usuário (a fila "Atribuídos a mim"); exclusivo com `unassignedOnly`. */
  assignedToUserId?: string;
  sort: TicketSortOrder;
  page: number;
  pageSize: number;
}
