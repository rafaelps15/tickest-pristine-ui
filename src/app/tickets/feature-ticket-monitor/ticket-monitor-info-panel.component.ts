import { Component, ChangeDetectionStrategy, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TICKET_AWAITING_LABELS } from '../entities/ticket-awaiting';
import { TicketQuickInfoStore } from '../application/ticket-quick-info.store';
import { SidePanelDirective } from '../../shared/ui/directives/side-panel.directive';

/**
 * Painel "Informações do Ticket" de Monitorar Tickets: mostra na hora os dados que já vieram na
 * linha selecionada da tabela (via `ticket`) e busca só a descrição completa
 * (`TicketQuickInfoStore`), sem bloquear o resto do painel enquanto ela carrega. Link pra tela de
 * detalhe completo (RF-29a). Quem decide qual ticket mostrar e aciona a busca é o componente pai
 * (`TicketMonitorComponent`) — este painel só exibe o que recebe e o que a própria busca devolve.
 */
@Component({
  selector: 'app-ticket-monitor-info-panel',
  imports: [RouterLink, NgClass, DatePipe, SidePanelDirective],
  templateUrl: './ticket-monitor-info-panel.component.html',
  styleUrl: './ticket-monitor-info-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketMonitorInfoPanelComponent {
  readonly ticket = input.required<TicketMonitorItem>();
  /**
   * Se o painel está no modo overlay de tela cheia (abaixo de "lg"): vira um diálogo modal de
   * verdade (`aria-modal`) e prende o Tab dentro dele, já que a tabela por trás fica coberta.
   */
  readonly modal = input(false);
  /** Mostra "Atribuir a mim" (chamado ativo, sem responsável, pra quem administra a fila) — mesma regra da linha. */
  readonly canAssignToMe = input(false);
  /** Mostra "Atribuir/Alterar responsável" (chamado ativo, pra quem administra a fila) — mesma regra da linha. */
  readonly canAssignResponsible = input(false);
  /** "Atribuir a mim" deste chamado está em andamento. */
  readonly assigningToMe = input(false);
  /** Prazo relativo ("vence em 2h" / "venceu há 35 min"), calculado pela tela com a hora do servidor; null sem prazo correndo. */
  readonly dueRelative = input<string | null>(null);
  /** Se o prazo já passou (pela hora do servidor). */
  readonly overdue = input(false);
  /** Situação de SLA que a linha mostra (acompanha o relógio); sem ela, a que veio da lista. */
  readonly slaStatus = input<TicketSlaStatus | null>(null);
  readonly close = output<void>();
  /** Atalho do painel: atribuir o chamado a quem está logado. */
  readonly assignToMeClick = output<void>();
  /** Atalho do painel: abrir o diálogo "Atribuir responsável". */
  readonly assignResponsibleClick = output<void>();

  protected readonly quickInfoStore = inject(TicketQuickInfoStore);

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
  protected readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
  protected readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
  protected readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
  protected readonly awaitingLabels = TICKET_AWAITING_LABELS;

  /** Situação de SLA exibida: a mesma da linha da tabela. */
  protected readonly shownSlaStatus = computed(() => this.slaStatus() ?? this.ticket().slaStatus);
  /** Chamado sem SLA não tem prazo pra mostrar. */
  protected readonly hasDeadline = computed(() => this.ticket().slaStatus !== TicketSlaStatus.NotApplicable);
}
