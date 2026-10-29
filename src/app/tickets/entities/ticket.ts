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
  /** Nome completo de quem atende, ou null enquanto ninguém assumiu. */
  assignedToName: string | null;
  /** Setor de destino do chamado. */
  sectorId: string;
  /** Nome do setor de destino. */
  sectorName: string;
  createdAtUtc: string;
  /** Prazo de resolução do primeiro ciclo (UTC) — congelado depois de reabrir; a lista usa {@link currentDueAtUtc}. */
  dueAtUtc: string;
  /** Situação do chamado em relação ao prazo do primeiro ciclo, pela mesma regra do Monitor. */
  slaStatus: TicketSlaStatus;
  /** Prazo do ciclo de resolução vigente (UTC): o novo, depois de reabrir (spec 024; ausente enquanto o back-end não manda). */
  currentDueAtUtc?: string;
  /** Situação do ciclo de resolução vigente (spec 024; ausente enquanto o back-end não manda). */
  currentSlaStatus?: TicketSlaStatus;
  /** Data da ação mais recente registrada no histórico do chamado (UTC). */
  lastActivityAtUtc: string;
  /** Se quem está logado pode cancelar agora (dono na janela de 15 min, ou `tickets:cancel`). */
  canCancel: boolean;
  /** Fim da janela em que o dono ainda pode cancelar: abertura + 15 min (UTC). */
  ownerCancelDeadlineUtc: string;
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
  /** Se quem está logado pode cancelar agora (dono na janela de 15 min, ou `tickets:cancel`). */
  canCancel: boolean;
  /** Fim da janela em que o dono ainda pode cancelar: abertura + 15 min (UTC). */
  ownerCancelDeadlineUtc: string;
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
