/** Totais de tickets por status, de toda a empresa (GET /tickets/stats/status). */
export interface TicketStatusCounts {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  canceledCount: number;
}
