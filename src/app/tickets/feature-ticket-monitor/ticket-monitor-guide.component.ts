import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';

/** Chave usada para lembrar se o Guia da Tela ficou aberto ou fechado, entre sessões. */
const GUIDE_OPEN_STORAGE_KEY = 'tickest.ticketMonitorGuide.open';

/** Explicação de uma linha por valor de SLA — mesmos 6 valores que a coluna SLA da tabela pode exibir. */
const SLA_EXPLANATIONS: Record<TicketSlaStatus, string> = {
  [TicketSlaStatus.OnTime]: 'Dentro do prazo de atendimento definido pelo SLA.',
  [TicketSlaStatus.AtRisk]: 'Perto de vencer o prazo — ainda dentro do SLA, mas exige atenção.',
  [TicketSlaStatus.Breached]: 'Já passou do prazo de atendimento e ainda está em aberto.',
  [TicketSlaStatus.Met]: 'Chamado resolvido dentro do prazo do SLA.',
  [TicketSlaStatus.Missed]: 'Chamado resolvido, mas depois do prazo do SLA.',
  [TicketSlaStatus.NotApplicable]: 'Este chamado não tem uma política de SLA aplicável.'
};

/** Lê a preferência salva de aberto/fechado; `true` (aberto) se não houver nada salvo ou a leitura falhar. */
function readStoredOpenPreference(): boolean {
  try {
    const saved = localStorage.getItem(GUIDE_OPEN_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Painel "Guia da Tela" de Monitorar Tickets: legenda de prioridade e status (mesma fonte única
 * da tabela) e uma explicação de uma linha por valor de SLA que a coluna SLA pode exibir.
 * Componente de apresentação — não injeta nenhum Store, só lê os rótulos/badges compartilhados.
 */
@Component({
  selector: 'app-ticket-monitor-guide',
  imports: [NgClass],
  templateUrl: './ticket-monitor-guide.component.html',
  styleUrl: './ticket-monitor-guide.component.css',
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

  /** Se o painel está aberto — restaurado do localStorage, sem quebrar a tela se a leitura falhar. */
  protected readonly open = signal(readStoredOpenPreference());

  /** Alterna o painel e salva a preferência, sem quebrar a tela se a escrita falhar. */
  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);

    try {
      localStorage.setItem(GUIDE_OPEN_STORAGE_KEY, String(next));
    } catch {
      // Preferência não persiste nesta sessão (ex.: modo privado); a tela continua funcionando.
    }
  }
}
