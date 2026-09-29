import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';

/** Ticket do usuário logado, conforme retornado por GET /tickets/users/{userId}. */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  openedByUserId: string;
  assignedToUserId: string | null;
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
