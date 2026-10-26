import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';
import { TicketSlaStatus } from './ticket-sla-status';
import { TicketSla } from './ticket-sla';

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
  /**
   * Plano, objetivos (Primeira resposta/Resolução) e ciclos de SLA em minutos úteis. `slaStatus`/
   * `dueAtUtc` acima continuam sendo os do primeiro ciclo mesmo após uma reabertura — o prazo
   * vigente de verdade é sempre o objetivo com `isCurrentCycle: true` aqui dentro.
   */
  sla: TicketSla;
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
