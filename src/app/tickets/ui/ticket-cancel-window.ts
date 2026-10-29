/** Permissão de cancelar qualquer chamado, a qualquer momento (spec 016 do back-end). */
export const TICKETS_CANCEL_PERMISSION = 'tickets:cancel';

/** O que a regra de cancelamento precisa do chamado — o mesmo em `Ticket` e `TicketDetail`. */
export interface TicketCancelInfo {
    /** Se quem está logado pode cancelar agora, calculado pelo back-end na hora da consulta. */
    canCancel: boolean;
    /** Fim da janela em que o dono ainda pode cancelar (abertura + 15 min), em UTC. */
    ownerCancelDeadlineUtc: string;
}

/** Minutos que faltam na janela do dono (arredondados pra cima); 0 quando já terminou. */
export function ownerCancelMinutesLeft(ticket: TicketCancelInfo, nowMs: number): number {
    const msLeft = new Date(ticket.ownerCancelDeadlineUtc).getTime() - nowMs;
    return msLeft > 0 ? Math.ceil(msLeft / 60_000) : 0;
}

/**
 * Se o "Cancelar" deve aparecer agora. O back-end decide (`canCancel`) na hora da consulta; pra quem
 * só cancela pela janela de dono (sem `tickets:cancel`), o front também confere o relógio, pra o
 * botão sumir sozinho quando o prazo vencer com a tela aberta, em vez de o clique dar 403.
 */
export function isCancelAvailable(ticket: TicketCancelInfo, nowMs: number, canCancelAny: boolean): boolean {
    if (!ticket.canCancel) return false;
    if (canCancelAny) return true;
    return ownerCancelMinutesLeft(ticket, nowMs) > 0;
}

/**
 * Aviso do tempo restante pro dono ("por mais 8 min"), ou null quando não se aplica — quem tem
 * `tickets:cancel` cancela sem prazo, então não vê contagem.
 */
export function ownerCancelHint(ticket: TicketCancelInfo, nowMs: number, canCancelAny: boolean): string | null {
    if (canCancelAny || !isCancelAvailable(ticket, nowMs, canCancelAny)) return null;
    const minutes = ownerCancelMinutesLeft(ticket, nowMs);
    return minutes === 1 ? 'por mais 1 min' : `por mais ${minutes} min`;
}
