/**
 * Contagens de SLA dos chamados ativos (GET /tickets/sla-summary) — reabertos depois de uma
 * resolução entram em {@link activeCount}, mas não nos contadores de prazo, porque o SLA deles já
 * foi decidido. {@link serverNowUtc} permite recalcular os badges pelo relógio do servidor.
 */
export interface TicketSlaSummary {
  activeCount: number;
  onTimeCount: number;
  atRiskCount: number;
  breachedCount: number;
  serverNowUtc: string;
}
