import { TicketPriority } from './ticket-priority';

/** Quem atende os chamados do recorte: só os meus, ou só os sem responsável (ausente = qualquer um). */
export type TicketDashboardAssignee = 'me' | 'none';

/**
 * Recorte que vale pra todos os widgets operacionais do Início, já resolvido pra o que a API
 * aceita: o departamento vira a lista dos setores dele, e o período, datas `aaaa-mm-dd`.
 */
export interface TicketDashboardScope {
  /** Setores (ausente = todos). */
  sectorIds?: string[];
  /** Uma prioridade só. */
  priority?: TicketPriority;
  /** Só meus, ou só sem responsável; exclusivo com `assignedToUserId`. */
  assignee?: TicketDashboardAssignee;
  /** Só os chamados desta pessoa. */
  assignedToUserId?: string;
  /** Início do período (inclusivo). */
  from?: string;
  /** Fim do período (inclusivo). */
  to?: string;
}

/** Volume do recorte, por situação. */
export interface TicketDashboardVolume {
  /** Todos os status. */
  totalCount: number;
  /** Só Aberto. */
  openCount: number;
  /** Só Em Andamento. */
  inProgressCount: number;
  /** Só Resolvido. */
  resolvedCount: number;
  /** Só Fechado. */
  closedCount: number;
  /** Só Cancelado. */
  canceledCount: number;
  /** Aberto + Em Andamento (ainda não resolvidos). */
  backlogCount: number;
}

/** SLA do recorte (a regra de cada situação é a do back-end, `TicketSlaFilters`). */
export interface TicketDashboardSla {
  /** Ativos dentro do prazo. */
  onTimeCount: number;
  /** Ativos que já passaram do aviso (75% da meta) e ainda não venceram. */
  atRiskCount: number;
  /** Ativos com o prazo vencido. */
  breachedCount: number;
  /** Resolvidos dentro do prazo. */
  metCount: number;
  /** Resolvidos depois do prazo. */
  missedCount: number;
  /** Sem SLA. */
  notApplicableCount: number;
}

/** O que pede ação agora, em ordem de gravidade. */
export interface TicketDashboardAttention {
  /** Ativos com o prazo vencido. */
  breachedCount: number;
  /** Ativos com prioridade Urgente. */
  criticalCount: number;
  /** Ativos sem responsável. */
  unassignedCount: number;
  /** Ativos esperando o solicitante (spec 029; ausente em back-end anterior a ela). */
  waitingOnRequesterCount?: number;
  /** Ativos esperando quem atende (spec 029; ausente em back-end anterior a ela). */
  waitingOnAgentCount?: number;
}

/** Agregado do recorte numa resposta só (GET /tickets/stats/overview, spec 026 do back-end). */
export interface TicketDashboardOverview {
  /** Hora do servidor no cálculo (UTC). */
  serverNowUtc: string;
  /** Volume por situação. */
  volume: TicketDashboardVolume;
  /** Situações do SLA. */
  sla: TicketDashboardSla;
  /** Central de atenção. */
  attention: TicketDashboardAttention;
}
