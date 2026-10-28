/** Agrupamento do volume de tickets abertos (espelha TicketVolumeGrouping no back-end — enviado por nome, não número). */
export type TicketVolumeGrouping = 'Day' | 'Week' | 'Month';

/** Rótulo em português para exibição. */
export const TICKET_VOLUME_GROUPING_LABELS: Record<TicketVolumeGrouping, string> = {
  Day: 'Dia',
  Week: 'Semana',
  Month: 'Mês'
};

/** Ordem de exibição do alternador de período. */
export const TICKET_VOLUME_GROUPING_OPTIONS: TicketVolumeGrouping[] = ['Day', 'Week', 'Month'];

/** Um ponto do volume de chamados num período (GET /tickets/stats/volume), da empresa toda ou de um recorte. */
export interface TicketVolumePoint {
  /** Início do período (dd da semana para "Week", dia 1 do mês para "Month"), formato aaaa-mm-dd. */
  periodStart: string;
  /** Chamados criados no período. */
  count: number;
  /** Resoluções no período, inclusive depois de reabrir (spec 028; ausente enquanto o back-end não manda). */
  resolvedCount?: number;
}
