import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TicketQuickInfoStore } from '../application/ticket-quick-info.store';

/**
 * Painel "Informações do Ticket" de Monitorar Tickets: mostra na hora os dados que já vieram na
 * linha selecionada da tabela (via `ticket`) e busca só a descrição completa
 * (`TicketQuickInfoStore`), sem bloquear o resto do painel enquanto ela carrega. Link pra tela de
 * detalhe completo (RF-29a). Quem decide qual ticket mostrar e aciona a busca é o componente pai
 * (`TicketMonitorComponent`) — este painel só exibe o que recebe e o que a própria busca devolve.
 */
@Component({
  selector: 'app-ticket-monitor-info-panel',
  imports: [RouterLink, NgClass, DatePipe],
  templateUrl: './ticket-monitor-info-panel.component.html',
  styleUrl: './ticket-monitor-info-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketMonitorInfoPanelComponent {
  readonly ticket = input.required<TicketMonitorItem>();
  readonly close = output<void>();

  protected readonly quickInfoStore = inject(TicketQuickInfoStore);

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
  protected readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
  protected readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
  protected readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
}
