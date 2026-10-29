import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { Ticket } from '../entities/ticket';
import { TICKET_ACTIVE_STATUSES } from '../entities/ticket-status';

/** Tom visual da situação do prazo: neutro, de atenção ou de alerta (cor nunca é o único sinal — o texto diz). */
export type DueTone = 'neutral' | 'warning' | 'danger';

/** Como a coluna "Prazo" de Meus Chamados conta cada situação, na voz de quem abriu o chamado. */
export interface DueDisplay {
    /** Texto da situação (ex.: "Perto de vencer"). */
    label: string;
    /** Ícone Boxicons que acompanha o texto. */
    icon: string;
    /** Tom do texto e do ícone. */
    tone: DueTone;
    /** Se a data do prazo aparece abaixo — sem prazo, não há data a mostrar. */
    showDate: boolean;
    /** O que a data é, antes dela ("até", "venceu em", "prazo era") — sem isso, a data de um resolvido lia como a da resolução. */
    datePrefix: string;
}

/**
 * Situação do prazo em Meus Chamados. Texto com ícone, e não a pílula colorida do Monitor: assim o
 * Status é a única pílula da linha (antes "Aberto" e "Em risco" eram o mesmo âmbar, lado a lado), e o
 * vocabulário é o de quem pediu ("Perto de vencer"), não o de quem atende a fila ("Em risco").
 */
export const TICKET_LIST_DUE_DISPLAY: Record<TicketSlaStatus, DueDisplay> = {
    [TicketSlaStatus.OnTime]: { label: 'No prazo', icon: 'bx-time', tone: 'neutral', showDate: true, datePrefix: 'até' },
    [TicketSlaStatus.AtRisk]: { label: 'Perto de vencer', icon: 'bx-time-five', tone: 'warning', showDate: true, datePrefix: 'até' },
    [TicketSlaStatus.Breached]: { label: 'Atrasado', icon: 'bx-error-circle', tone: 'danger', showDate: true, datePrefix: 'venceu em' },
    [TicketSlaStatus.Met]: { label: 'Resolvido no prazo', icon: 'bx-check-circle', tone: 'neutral', showDate: true, datePrefix: 'prazo era' },
    [TicketSlaStatus.Missed]: { label: 'Resolvido depois do prazo', icon: 'bx-check-circle', tone: 'neutral', showDate: true, datePrefix: 'prazo era' },
    [TicketSlaStatus.NotApplicable]: { label: 'Sem prazo', icon: 'bx-minus-circle', tone: 'neutral', showDate: false, datePrefix: '' }
};

/**
 * Chamado reaberto cujo prazo novo a lista não recebeu (back-end antes da spec 024): a situação que
 * veio é a do ciclo encerrado ("Resolvido depois do prazo" num chamado Aberto), então a coluna não a
 * mostra — diz que o prazo novo está no detalhe, em vez de afirmar algo falso.
 */
export const TICKET_LIST_REOPENED_DUE_DISPLAY: DueDisplay = {
    label: 'Reaberto: prazo novo no chamado', icon: 'bx-revision', tone: 'neutral', showDate: false, datePrefix: ''
};

/** Ordem em que o Guia da Tela explica as situações — a ordem em que um chamado passa por elas. */
export const TICKET_LIST_DUE_LEGEND: TicketSlaStatus[] = [
    TicketSlaStatus.OnTime,
    TicketSlaStatus.AtRisk,
    TicketSlaStatus.Breached,
    TicketSlaStatus.Met,
    TicketSlaStatus.Missed,
    TicketSlaStatus.NotApplicable
];

/** Prazo e situação que a coluna "Prazo" mostra. */
export interface TicketDue {
    /** Prazo (UTC). */
    dueAtUtc: string;
    /** Situação em relação ao prazo. */
    slaStatus: TicketSlaStatus;
    /** Como a coluna mostra a situação (o ciclo encerrado de um reaberto vira {@link TICKET_LIST_REOPENED_DUE_DISPLAY}). */
    display: DueDisplay;
}

/** Situações de um ciclo já encerrado — num chamado ativo, só aparecem se vieram do ciclo anterior. */
const CLOSED_CYCLE_STATUSES: ReadonlySet<TicketSlaStatus> = new Set([TicketSlaStatus.Met, TicketSlaStatus.Missed]);

/**
 * O prazo do ciclo de resolução vigente (spec 024): num chamado reaberto, o novo prazo e a situação
 * calculada sobre ele, como a seção SLA do detalhe. Sem os campos do ciclo vigente (back-end antes
 * da spec 024), o prazo do primeiro ciclo — exceto quando ele já se encerrou num chamado ativo.
 */
export function currentTicketDue(ticket: Ticket): TicketDue {
    const dueAtUtc = ticket.currentDueAtUtc ?? ticket.dueAtUtc;
    const slaStatus = ticket.currentSlaStatus ?? ticket.slaStatus;
    const staleCycle = ticket.currentSlaStatus == null
        && TICKET_ACTIVE_STATUSES.has(ticket.status)
        && CLOSED_CYCLE_STATUSES.has(slaStatus);
    return { dueAtUtc, slaStatus, display: staleCycle ? TICKET_LIST_REOPENED_DUE_DISPLAY : TICKET_LIST_DUE_DISPLAY[slaStatus] };
}
