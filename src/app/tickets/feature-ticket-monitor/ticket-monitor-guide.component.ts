import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS } from '../entities/ticket-sla-status';
import { TICKET_SLA_STATUS_BADGE_CLASS } from '../ui/ticket-badge-classes';

/** Explicação de uma linha por valor de SLA — mesmos 6 valores que a coluna SLA da tabela pode exibir. */
const SLA_EXPLANATIONS: Record<TicketSlaStatus, string> = {
  [TicketSlaStatus.OnTime]: 'Dentro do prazo de atendimento definido pelo SLA.',
  [TicketSlaStatus.AtRisk]: 'Já usou 75% do prazo — ainda dentro do SLA, mas exige atenção.',
  [TicketSlaStatus.Breached]: 'Já passou do prazo de atendimento e ainda está em aberto.',
  [TicketSlaStatus.Met]: 'Chamado resolvido dentro do prazo do SLA.',
  [TicketSlaStatus.Missed]: 'Chamado resolvido, mas depois do prazo do SLA.',
  [TicketSlaStatus.NotApplicable]: 'Este chamado não tem uma política de SLA aplicável.'
};

/**
 * Conteúdo do "Guia da Tela" de Monitorar Chamados: como ler a fila (o padrão, o prazo relativo, o
 * escopo dos números e o "aguardando") e uma explicação de uma linha por valor de SLA.
 * Não injeta nenhum Store, só lê os rótulos/badges compartilhados; o card vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-ticket-monitor-guide',
  imports: [NgClass, ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './ticket-monitor-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketMonitorGuideComponent {
  /** As situações de SLA, na ordem do enum, uma por linha do guia. */
  protected readonly slaStatusOptions = Object.values(TicketSlaStatus).filter((v): v is TicketSlaStatus => typeof v === 'number');

  /** Rótulo de cada situação de SLA. */
  protected readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
  /** Classe de badge de cada situação de SLA. */
  protected readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
  /** Explicação de uma linha de cada situação de SLA. */
  protected readonly slaExplanations = SLA_EXPLANATIONS;
}
