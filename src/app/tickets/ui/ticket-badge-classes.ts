import { TicketStatus } from '../entities/ticket-status';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSlaObjectiveState } from '../entities/ticket-sla';

/** Classe de badge Bootstrap por status, para exibição consistente nas listas. */
export const TICKET_STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'bg-label-warning',
  [TicketStatus.InProgress]: 'bg-label-info',
  [TicketStatus.Resolved]: 'bg-label-success',
  [TicketStatus.Closed]: 'bg-label-secondary',
  [TicketStatus.Canceled]: 'bg-label-secondary'
};

/** Classe de badge Bootstrap por prioridade, para exibição consistente nas listas. */
export const TICKET_PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  [TicketPriority.Low]: 'bg-label-secondary',
  [TicketPriority.Medium]: 'bg-label-primary',
  [TicketPriority.High]: 'bg-label-warning',
  [TicketPriority.Urgent]: 'bg-label-danger'
};

/**
 * Classe de badge Bootstrap por situação do SLA (as classes bg-label-* já têm variante para o dark mode).
 * "No prazo" é neutro de propósito (DESIGN.md, risco de SLA): não pede ação e não compete com âmbar e vermelho.
 */
export const TICKET_SLA_STATUS_BADGE_CLASS: Record<TicketSlaStatus, string> = {
  [TicketSlaStatus.OnTime]: 'bg-label-secondary',
  [TicketSlaStatus.AtRisk]: 'bg-label-warning',
  [TicketSlaStatus.Breached]: 'bg-label-danger',
  [TicketSlaStatus.Met]: 'bg-label-success',
  [TicketSlaStatus.Missed]: 'bg-label-danger',
  [TicketSlaStatus.NotApplicable]: 'bg-label-secondary'
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
