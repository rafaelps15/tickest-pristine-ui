/** Ação registrada no histórico de um ticket (espelha TicketHistoryAction no back-end). */
export enum TicketHistoryAction {
  Created = 1,
  StatusChanged = 2,
  Reassigned = 3,
  Reopened = 4,
  Deleted = 5,
  MessageAdded = 6,
  AttachmentAdded = 7,
  AttachmentRemoved = 8,
  MessageEdited = 9,
  MessageRemoved = 10,
  Unassigned = 11
}

/**
 * Um evento do histórico de um ticket, conforme GET /tickets/{id}/history. A descrição já vem
 * pronta em português do back-end — o front não mantém um texto próprio por ação.
 */
export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  changedByUserId: string | null;
  action: TicketHistoryAction;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  occurredAtUtc: string;
}
