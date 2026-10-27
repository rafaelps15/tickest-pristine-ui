import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';

/** O que cada status significa pra quem abriu o chamado — uma linha por status. */
const STATUS_EXPLANATIONS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Aguardando alguém do setor assumir.',
  [TicketStatus.InProgress]: 'Alguém do setor já está atendendo.',
  [TicketStatus.Resolved]: 'O setor concluiu — confira e reabra se não ficou certo.',
  [TicketStatus.Closed]: 'Encerrado de vez.',
  [TicketStatus.Canceled]: 'Cancelado antes de ser resolvido.'
};

/**
 * Conteúdo do "Guia da Tela" de Meus Chamados: o que cada status quer dizer pra quem abriu o
 * chamado, o que dá pra fazer em cada fase e a legenda de prioridade. O card vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-ticket-list-guide',
  imports: [NgClass, ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './ticket-list-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketListGuideComponent {
  protected readonly statusOptions = Object.values(TicketStatus).filter((v): v is TicketStatus => typeof v === 'number');
  protected readonly priorityOptions = Object.values(TicketPriority).filter((v): v is TicketPriority => typeof v === 'number');

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
  protected readonly statusExplanations = STATUS_EXPLANATIONS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
  protected readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
}
