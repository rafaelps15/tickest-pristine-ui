import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';
import { TicketSlaStatus } from './ticket-sla-status';

/** Ticket do usuário logado, conforme retornado (paginado) por GET /tickets/mine. */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  openedByUserId: string;
  assignedToUserId: string | null;
  createdAtUtc: string;
}

/** Detalhe de um ticket, conforme retornado por GET /tickets/{id}. */
export interface TicketDetail {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  openedByUserId: string;
  openedByName: string;
  assignedToUserId: string | null;
  assignedToName: string | null;
  sectorId: string;
  sectorName: string;
  createdAtUtc: string;
  dueAtUtc: string;
  slaWarningAtUtc: string;
  resolvedAtUtc: string | null;
  slaStatus: TicketSlaStatus;
}

/** Quantidade de tickets numa combinação de prioridade e status, conforme GET /tickets/mine/summary. */
export interface TicketCount {
  priority: TicketPriority;
  status: TicketStatus;
  count: number;
}

/** Dados para abertura de um novo ticket (POST /tickets). */
export interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  sectorId: string;
  requesterId?: string;
  responsibleId?: string;
}

/** Dados para atualização de um ticket existente (PUT /tickets/{id}). */
export interface UpdateTicketData {
  description: string;
  status: TicketStatus;
}
