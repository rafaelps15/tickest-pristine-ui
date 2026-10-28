import { TicketPriority } from './ticket-priority';

/** Quem atende os chamados do recorte: só os meus, ou só os sem responsável (ausente = qualquer um). */
export type TicketDashboardAssignee = 'me' | 'none';

/**
 * Recorte que vale pra todos os widgets operacionais do Início — os filtros que o back-end aceita
 * em GET /tickets. Período, departamento e equipe ficam de fora: a API não tem esses filtros.
 */
export interface TicketDashboardScope {
  /** Um setor só. */
  sectorId?: string;
  /** Uma prioridade só. */
  priority?: TicketPriority;
  /** Só meus, ou só sem responsável. */
  assignee?: TicketDashboardAssignee;
}

/** Volume do recorte, por situação. */
export interface TicketDashboardVolume {
  /** Todos os status. */
  total: number;
  /** Aberto + Em Andamento (ainda não resolvidos). */
  backlog: number;
  /** Só Em Andamento. */
  inProgress: number;
  /** Só Resolvido. */
  resolved: number;
  /** Só Fechado. */
  closed: number;
}

/** SLA do recorte (a regra de cada situação é a do back-end, `TicketSlaFilters`). */
export interface TicketDashboardSla {
  /** Resolvidos dentro do prazo (todo o histórico — a API não filtra por período). */
  met: number;
  /** Ativos com o prazo vencido. */
  breached: number;
  /** Ativos que já passaram do aviso (75% da meta, regra do back-end) e ainda não venceram. */
  atRisk: number;
}

/** O que pede ação agora, em ordem de gravidade. */
export interface TicketDashboardAttention {
  /** Ativos com o prazo vencido. */
  overdue: number;
  /** Ativos com prioridade Urgente. */
  critical: number;
  /** Ativos sem responsável. */
  unassigned: number;
}
