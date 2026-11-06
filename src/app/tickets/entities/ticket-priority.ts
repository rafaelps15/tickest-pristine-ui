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
