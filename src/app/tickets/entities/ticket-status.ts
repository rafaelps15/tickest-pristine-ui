/** Status do ciclo de vida de um ticket (espelha TicketStatus no back-end). */
export enum TicketStatus {
  Open = 1,
  InProgress = 2,
  Resolved = 3,
  Closed = 4,
  Canceled = 5
}

/** Rótulo em português para exibição. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Aberto',
  [TicketStatus.InProgress]: 'Em Andamento',
  [TicketStatus.Resolved]: 'Resolvido',
  [TicketStatus.Closed]: 'Fechado',
  [TicketStatus.Canceled]: 'Cancelado'
};

/** Classe de badge Bootstrap por status, para exibição consistente nas listas. */
export const TICKET_STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'bg-label-warning',
  [TicketStatus.InProgress]: 'bg-label-info',
  [TicketStatus.Resolved]: 'bg-label-success',
  [TicketStatus.Closed]: 'bg-label-secondary',
  [TicketStatus.Canceled]: 'bg-label-danger'
};

/** Status em que o ticket ainda está ativo (aceita atribuir/remover responsável). */
export const TICKET_ACTIVE_STATUSES: ReadonlySet<TicketStatus> = new Set([TicketStatus.Open, TicketStatus.InProgress]);
