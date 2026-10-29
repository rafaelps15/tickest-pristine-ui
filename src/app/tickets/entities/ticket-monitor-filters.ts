import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';
import { TicketSlaStatus } from './ticket-sla-status';
import { TicketSortOrder } from './ticket-sort-order';
import { TicketAwaiting } from './ticket-awaiting';

/** Filtros e paginação da listagem de "Monitorar Tickets" (GET /tickets). */
export interface TicketMonitorFilters {
  status?: TicketStatus;
  /**
   * Só os chamados ativos (Aberto e Em Andamento) — o "backlog". Exclusivo com `status`: com um
   * status escolhido, este fica de fora. Na URL, `?status=active`.
   */
  activeOnly?: boolean;
  priority?: TicketPriority;
  /** Setores (vários vêm do drill-down de um departamento no Início); na URL, `sectorId` repetido. */
  sectorIds?: string[];
  /** Abertos a partir deste dia (`aaaa-mm-dd`, horário de Brasília). */
  createdFrom?: string;
  /** Abertos até este dia (inclusivo). */
  createdTo?: string;
  /** De quem o chamado espera ação. */
  awaiting?: TicketAwaiting;
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
