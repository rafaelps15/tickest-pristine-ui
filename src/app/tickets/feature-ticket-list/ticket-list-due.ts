import { TicketSlaStatus } from '../entities/ticket-sla-status';

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
}

/**
 * Situação do prazo em Meus Chamados. Texto com ícone, e não a pílula colorida do Monitor: assim o
 * Status é a única pílula da linha (antes "Aberto" e "Em risco" eram o mesmo âmbar, lado a lado), e o
 * vocabulário é o de quem pediu ("Perto de vencer"), não o de quem atende a fila ("Em risco").
 */
export const TICKET_LIST_DUE_DISPLAY: Record<TicketSlaStatus, DueDisplay> = {
    [TicketSlaStatus.OnTime]: { label: 'No prazo', icon: 'bx-time', tone: 'neutral', showDate: true },
    [TicketSlaStatus.AtRisk]: { label: 'Perto de vencer', icon: 'bx-time-five', tone: 'warning', showDate: true },
    [TicketSlaStatus.Breached]: { label: 'Atrasado', icon: 'bx-error-circle', tone: 'danger', showDate: true },
    [TicketSlaStatus.Met]: { label: 'Resolvido no prazo', icon: 'bx-check-circle', tone: 'neutral', showDate: true },
    [TicketSlaStatus.Missed]: { label: 'Resolvido depois do prazo', icon: 'bx-check-circle', tone: 'neutral', showDate: true },
    [TicketSlaStatus.NotApplicable]: { label: 'Sem prazo', icon: 'bx-minus-circle', tone: 'neutral', showDate: false }
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
