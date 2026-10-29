import { TicketStatus, TICKET_ACTIVE_STATUSES } from '../entities/ticket-status';

/** Quem atende a fila: edita, muda status, assume e reabre qualquer chamado. */
export const TICKETS_MANAGE_PERMISSION = 'tickets:manage';

/** Dono pode editar a descrição do próprio chamado. */
export const TICKETS_UPDATE_OWN_PERMISSION = 'tickets:update-own';

/** Dono pode reabrir o próprio chamado. */
export const TICKETS_REOPEN_OWN_PERMISSION = 'tickets:reopen-own';

/** Atribuir o chamado a outra pessoa (além de `tickets:manage`, exigido pelo endpoint). */
export const TICKETS_ASSIGN_PERMISSION = 'tickets:assign';

/** Consulta de permissão do usuário logado, como `SessionService.hasPermission`. */
export type HasPermission = (code: string) => boolean;

/**
 * Só controla a visibilidade dos botões: a API decide e responde 403 de qualquer forma. Espelha
 * `UpdateTicketCommandHandler` (dono com `tickets:update-own`, ou `tickets:manage`) com o chamado ativo.
 */
export function canEditTicketDescription(status: TicketStatus, isOwner: boolean, hasPermission: HasPermission): boolean {
    if (!TICKET_ACTIVE_STATUSES.has(status)) return false;
    return (isOwner && hasPermission(TICKETS_UPDATE_OWN_PERMISSION)) || hasPermission(TICKETS_MANAGE_PERMISSION);
}

/** Espelha `ReopenTicketCommandHandler`: dono com `tickets:reopen-own`, ou `tickets:manage`, com o chamado inativo. */
export function canReopenTicket(status: TicketStatus, isOwner: boolean, hasPermission: HasPermission): boolean {
    if (TICKET_ACTIVE_STATUSES.has(status)) return false;
    return (isOwner && hasPermission(TICKETS_REOPEN_OWN_PERMISSION)) || hasPermission(TICKETS_MANAGE_PERMISSION);
}

/** Espelha o endpoint de atribuição (`tickets:manage`) somado ao `AssignTicketCommandHandler` para outra pessoa (`tickets:assign`). */
export function canAssignTicketToOthers(status: TicketStatus, hasPermission: HasPermission): boolean {
    return TICKET_ACTIVE_STATUSES.has(status)
        && hasPermission(TICKETS_MANAGE_PERMISSION)
        && hasPermission(TICKETS_ASSIGN_PERMISSION);
}
