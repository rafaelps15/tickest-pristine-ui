import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';

/** Explicação de uma linha por valor de SLA — mesmos 6 valores que a coluna SLA da tabela pode exibir. */
const SLA_EXPLANATIONS: Record<TicketSlaStatus, string> = {
  [TicketSlaStatus.OnTime]: 'Dentro do prazo de atendimento definido pelo SLA.',
  [TicketSlaStatus.AtRisk]: 'Perto de vencer o prazo — ainda dentro do SLA, mas exige atenção.',
  [TicketSlaStatus.Breached]: 'Já passou do prazo de atendimento e ainda está em aberto.',
  [TicketSlaStatus.Met]: 'Chamado resolvido dentro do prazo do SLA.',
  [TicketSlaStatus.Missed]: 'Chamado resolvido, mas depois do prazo do SLA.',
  [TicketSlaStatus.NotApplicable]: 'Este chamado não tem uma política de SLA aplicável.'
};

/**
 * Conteúdo do "Guia da Tela" de Monitorar Chamados: legenda de prioridade e status (mesma fonte única
 * da tabela) e uma explicação de uma linha por valor de SLA que a coluna SLA pode exibir.
 * Não injeta nenhum Store, só lê os rótulos/badges compartilhados; o card vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-ticket-monitor-guide',
  imports: [NgClass, ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './ticket-monitor-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketMonitorGuideComponent {
  protected readonly statusOptions = Object.values(TicketStatus).filter((v): v is TicketStatus => typeof v === 'number');
  protected readonly priorityOptions = Object.values(TicketPriority).filter((v): v is TicketPriority => typeof v === 'number');
  protected readonly slaStatusOptions = Object.values(TicketSlaStatus).filter((v): v is TicketSlaStatus => typeof v === 'number');

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
  protected readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
  protected readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
  protected readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
  protected readonly slaExplanations = SLA_EXPLANATIONS;
}
