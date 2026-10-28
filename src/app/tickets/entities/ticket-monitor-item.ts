import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';
import { TicketSlaStatus } from './ticket-sla-status';
import { TicketAwaiting } from './ticket-awaiting';

/** Um ticket na listagem de "Monitorar Tickets" (todos os chamados do sistema), conforme GET /tickets. */
export interface TicketMonitorItem {
  id: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  assignedToUserId: string | null;
  assignedToName: string | null;
  sectorId: string;
  sectorName: string;
  createdAtUtc: string;
  dueAtUtc: string;
  slaWarningAtUtc: string;
  resolvedAtUtc: string | null;
  slaStatus: TicketSlaStatus;
  /** De quem o chamado espera ação; null quando inativo (spec 029; ausente enquanto o back-end não manda). */
  awaiting?: TicketAwaiting | null;
}
