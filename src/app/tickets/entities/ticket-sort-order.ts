/** Ordenação da listagem de "Monitorar Tickets" (espelha TicketSortOrder no back-end). */
export enum TicketSortOrder {
  Newest = 0,
  DueDate = 1
}

/** Rótulo em português para exibição. */
export const TICKET_SORT_ORDER_LABELS: Record<TicketSortOrder, string> = {
  [TicketSortOrder.Newest]: 'Mais recentes',
  [TicketSortOrder.DueDate]: 'Prazo mais próximo'
};
