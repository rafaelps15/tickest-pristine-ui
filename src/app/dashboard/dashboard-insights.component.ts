import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketMonitorItem, TicketSlaStatus } from '../tickets';

/**
 * Card "Alertas de SLA" do topo da coluna direita do Dashboard: totais de vencidos e em risco da
 * empresa (cada um levando à fila filtrada) e até 5 chamados críticos, o vencido há mais tempo
 * primeiro, cada um linkando pro detalhe do ticket. Componente de apresentação — recebe
 * a lista já pronta via `@Input`, não injeta nenhum Store (quem busca é o `TicketSummaryStore` do
 * componente pai, único lugar que sabe se o usuário logado tem a permissão `tickets:manage`).
 */
@Component({
  selector: 'app-dashboard-insights',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard-insights.component.html',
  styleUrl: './dashboard-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardInsightsComponent {
  /** Chamados com SLA vencido ou em risco, do prazo mais antigo pro mais novo. */
  readonly criticalTickets = input<TicketMonitorItem[]>([]);
  /** Total de chamados ativos com SLA vencido na empresa. */
  readonly breachedCount = input(0);
  /** Total de chamados ativos com SLA em risco na empresa. */
  readonly atRiskCount = input(0);

  /** Enum exposto ao template, pra comparar o SLA de cada item e montar o filtro da fila. */
  protected readonly TicketSlaStatus = TicketSlaStatus;
  /** Carregando a lista de chamados em risco de SLA. */
  readonly loading = input(false);
  /** Mensagem de erro ao buscar os chamados em risco de SLA, se a busca falhar. */
  readonly error = input<string | null>(null);
}
