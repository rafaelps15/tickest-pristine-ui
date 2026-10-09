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
  sort: TicketSortOrder;
  page: number;
  pageSize: number;
}
