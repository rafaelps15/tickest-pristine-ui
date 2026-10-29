import { TicketPriority } from './ticket-priority';
import { TicketStatus } from './ticket-status';

/** Quantos chamados do usuário logado estão numa combinação de status e prioridade (GET /tickets/mine/summary). */
export interface OwnTicketCount {
  /** Prioridade do grupo. */
  priority: TicketPriority;
  /** Status do grupo. */
  status: TicketStatus;
  /** Quantidade de chamados próprios nesse status e prioridade. */
  count: number;
}
