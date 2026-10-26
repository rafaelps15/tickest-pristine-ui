/** Métrica medida pelo SLA de um chamado. */
export enum TicketSlaMetric {
  FirstResponse = 1,
  Resolution = 2
}

/** Rótulo em português da métrica, para exibição. */
export const TICKET_SLA_METRIC_LABELS: Record<TicketSlaMetric, string> = {
  [TicketSlaMetric.FirstResponse]: 'Primeira resposta',
  [TicketSlaMetric.Resolution]: 'Resolução'
};

/** Situação de um objetivo de SLA (uma métrica, num ciclo). */
export enum TicketSlaObjectiveState {
  Running = 1,
  AtRisk = 2,
  Breached = 3,
  Met = 4,
  Missed = 5,
  Stopped = 6,
  NotApplicable = 7
}

/** Rótulo em português para exibição. */
export const TICKET_SLA_OBJECTIVE_STATE_LABELS: Record<TicketSlaObjectiveState, string> = {
  [TicketSlaObjectiveState.Running]: 'Em andamento',
  [TicketSlaObjectiveState.AtRisk]: 'Em risco',
  [TicketSlaObjectiveState.Breached]: 'Violado',
  [TicketSlaObjectiveState.Met]: 'Cumprido',
  [TicketSlaObjectiveState.Missed]: 'Perdido',
  [TicketSlaObjectiveState.Stopped]: 'Parado',
  [TicketSlaObjectiveState.NotApplicable]: 'Sem meta'
};

/** Classe de badge Bootstrap por situação do objetivo (as classes bg-label-* já têm variante para o dark mode). */
export const TICKET_SLA_OBJECTIVE_STATE_BADGE_CLASS: Record<TicketSlaObjectiveState, string> = {
  [TicketSlaObjectiveState.Running]: 'bg-label-success',
  [TicketSlaObjectiveState.AtRisk]: 'bg-label-warning',
  [TicketSlaObjectiveState.Breached]: 'bg-label-danger',
  [TicketSlaObjectiveState.Met]: 'bg-label-success',
  [TicketSlaObjectiveState.Missed]: 'bg-label-danger',
  [TicketSlaObjectiveState.Stopped]: 'bg-label-secondary',
  [TicketSlaObjectiveState.NotApplicable]: 'bg-label-secondary'
};

/**
 * Plano de SLA aplicado ao chamado — política, versão e calendário usados pelo back-end para
 * calcular os prazos em tempo útil (fora do expediente, fins de semana e feriados não contam).
 */
export interface TicketSlaPlan {
  policyId: string | null;
  policyName: string;
  policyVersion: number;
  calendarId: string;
  calendarName: string;
  /** Chamado anterior ao plano de SLA: prazos em horas corridas, sem meta de primeira resposta. */
  isLegacy: boolean;
}

/**
 * Um objetivo de SLA — uma métrica, num ciclo. Primeira resposta tem só um ciclo por chamado;
 * Resolução ganha um novo ciclo a cada reabertura, com os ciclos anteriores preservados como
 * histórico. Num chamado legado (sem meta de primeira resposta), o objetivo de Primeira resposta
 * vem com `state: NotApplicable` e todos os campos abaixo de `cycle`/`isCurrentCycle` nulos.
 */
export interface TicketSlaObjective {
  metric: TicketSlaMetric;
  cycle: number;
  state: TicketSlaObjectiveState;
  /** Minutos úteis até o prazo. Nulo quando não há meta. */
  targetMinutes: number | null;
  startedAtUtc: string | null;
  warningAtUtc: string | null;
  dueAtUtc: string | null;
  completedAtUtc: string | null;
  stoppedAtUtc: string | null;
  consumedMinutes: number | null;
  remainingMinutes: number | null;
  /** Indica se é o ciclo vigente desta métrica — os demais são ciclos anteriores (histórico). */
  isCurrentCycle: boolean;
}

/** Bloco de SLA completo de um chamado, conforme GET /tickets/{id} e GET /tickets/{id}/sla. */
export interface TicketSla {
  /** Hora do servidor no momento do cálculo — todo prazo relativo parte daqui, nunca do relógio do navegador. */
  serverNowUtc: string;
  plan: TicketSlaPlan;
  objectives: TicketSlaObjective[];
}
