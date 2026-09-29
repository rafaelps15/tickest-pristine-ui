/** Prioridade de um ticket (espelha TicketPriority no back-end). */
export enum TicketPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4
}

/** Rótulo em português para exibição. */
export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.Low]: 'Baixa',
  [TicketPriority.Medium]: 'Média',
  [TicketPriority.High]: 'Alta',
  [TicketPriority.Urgent]: 'Urgente'
};

/** Classe de badge Bootstrap por prioridade, para exibição consistente nas listas. */
export const TICKET_PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  [TicketPriority.Low]: 'bg-label-secondary',
  [TicketPriority.Medium]: 'bg-label-primary',
  [TicketPriority.High]: 'bg-label-warning',
  [TicketPriority.Urgent]: 'bg-label-danger'
};
