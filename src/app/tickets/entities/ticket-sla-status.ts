/** Situação do ticket em relação ao prazo de resolução (espelha TicketSlaStatus no back-end). */
export enum TicketSlaStatus {
  OnTime = 1,
  AtRisk = 2,
  Breached = 3,
  Met = 4,
  Missed = 5,
  NotApplicable = 6
}

/** Rótulo em português para exibição. */
export const TICKET_SLA_STATUS_LABELS: Record<TicketSlaStatus, string> = {
  [TicketSlaStatus.OnTime]: 'No prazo',
  [TicketSlaStatus.AtRisk]: 'Em risco',
  [TicketSlaStatus.Breached]: 'Atrasado',
  [TicketSlaStatus.Met]: 'Cumprido',
  [TicketSlaStatus.Missed]: 'Resolvido com atraso',
  [TicketSlaStatus.NotApplicable]: 'Sem SLA'
};

/** Classe de badge Bootstrap por situação do SLA (as classes bg-label-* já têm variante para o dark mode). */
export const TICKET_SLA_STATUS_BADGE_CLASS: Record<TicketSlaStatus, string> = {
  [TicketSlaStatus.OnTime]: 'bg-label-success',
  [TicketSlaStatus.AtRisk]: 'bg-label-warning',
  [TicketSlaStatus.Breached]: 'bg-label-danger',
  [TicketSlaStatus.Met]: 'bg-label-success',
  [TicketSlaStatus.Missed]: 'bg-label-danger',
  [TicketSlaStatus.NotApplicable]: 'bg-label-secondary'
};
