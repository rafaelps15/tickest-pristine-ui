import { TicketStatus, TICKET_ACTIVE_STATUSES } from '../entities/ticket-status';
import { TICKETS_MANAGE_PERMISSION } from '../../shared';

/** Dono pode editar a descrição do próprio chamado. */
export const TICKETS_UPDATE_OWN_PERMISSION = 'tickets:update-own';

/** Dono pode reabrir o próprio chamado — a única permissão que vale para o dono reabrir. */
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

/**
 * Espelha o `ReopenTicketCommandHandler` (linhas 33-41): o dono reabre com `tickets:reopen-own`, e só com ela —
 * `tickets:manage` não vale para o próprio chamado —; quem não é dono, com `tickets:manage`. Com o chamado inativo.
 */
export function canReopenTicket(status: TicketStatus, isOwner: boolean, hasPermission: HasPermission): boolean {
  if (TICKET_ACTIVE_STATUSES.has(status)) return false;
  return hasPermission(isOwner ? TICKETS_REOPEN_OWN_PERMISSION : TICKETS_MANAGE_PERMISSION);
}

/** Espelha o endpoint de atribuição (`tickets:manage`) somado ao `AssignTicketCommandHandler` para outra pessoa (`tickets:assign`). */
export function canAssignTicketToOthers(status: TicketStatus, hasPermission: HasPermission): boolean {
  return TICKET_ACTIVE_STATUSES.has(status)
    && hasPermission(TICKETS_MANAGE_PERMISSION)
    && hasPermission(TICKETS_ASSIGN_PERMISSION);
}

/**
 * "Atribuir a mim": o endpoint de atribuição exige só `tickets:manage` quando o responsável é quem chama
 * (`AssignTicketCommandHandler` só pede `tickets:assign` para outra pessoa), com o chamado ativo. Só sem
 * responsável: assumir o de outra pessoa vai exigir `tickets:assign` (decisão 2 de 05/11, LAC-9).
 */
export function canAssignTicketToSelf(status: TicketStatus, assignedToUserId: string | null, hasPermission: HasPermission): boolean {
  return TICKET_ACTIVE_STATUSES.has(status)
    && assignedToUserId === null
    && hasPermission(TICKETS_MANAGE_PERMISSION);
}
