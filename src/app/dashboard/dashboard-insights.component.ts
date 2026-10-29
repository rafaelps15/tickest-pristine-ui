import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketMonitorItem } from '../tickets';

/**
 * Card "Alertas de SLA" da trilha direita do Dashboard: até 5 chamados com SLA em risco mais
 * próximos de vencer, cada um linkando pro detalhe do ticket. Componente de apresentação — recebe
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
  /** Chamados com SLA em risco mais próximos de vencer, do mais urgente pro menos. */
  readonly criticalTickets = input<TicketMonitorItem[]>([]);
  /** Carregando a lista de chamados em risco de SLA. */
  readonly loading = input(false);
  /** Mensagem de erro ao buscar os chamados em risco de SLA, se a busca falhar. */
  readonly error = input<string | null>(null);
}
