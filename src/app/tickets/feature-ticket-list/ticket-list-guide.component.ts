import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_LIST_DUE_DISPLAY, TICKET_LIST_DUE_LEGEND } from './ticket-list-due';

/** O que cada status significa pra quem abriu o chamado — uma linha por status. */
const STATUS_EXPLANATIONS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Aguardando alguém do setor assumir.',
  [TicketStatus.InProgress]: 'Alguém do setor já está atendendo.',
  [TicketStatus.Resolved]: 'O setor concluiu — confira e reabra se não ficou certo.',
  [TicketStatus.Closed]: 'Encerrado depois de resolvido — dá pra reabrir se o problema voltar.',
  [TicketStatus.Canceled]: 'Cancelado antes de ser resolvido.'
};

/**
 * Conteúdo do "Guia da Tela" de Meus Chamados: o que cada status quer dizer pra quem abriu o
 * chamado, o que dá pra fazer em cada fase e o que diz a coluna Prazo (os mesmos textos e ícones da lista).
 * O card vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-ticket-list-guide',
  imports: [NgClass, ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './ticket-list-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketListGuideComponent {
  protected readonly statusOptions = Object.values(TicketStatus).filter((v): v is TicketStatus => typeof v === 'number');
  /** Situações de prazo, na ordem em que o chamado passa por elas — inclusive "Sem prazo". */
  protected readonly dueLegend = TICKET_LIST_DUE_LEGEND;
  /** Texto, ícone e tom de cada situação, os mesmos da coluna Prazo. */
  protected readonly dueDisplay = TICKET_LIST_DUE_DISPLAY;

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
  protected readonly statusExplanations = STATUS_EXPLANATIONS;

}
