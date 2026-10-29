/** Uma mensagem de um ticket, conforme GET /tickets/{ticketId}/messages (paginado por cursor, da mais recente para a mais antiga). */
export interface TicketMessage {
  id: string;
  ticketId: string;
  authorUserId: string;
  content: string;
  createdAtUtc: string;
  editedAtUtc: string | null;
}

/** Tamanho máximo do conteúdo de uma mensagem, espelhando PostTicketMessageCommandValidator no back-end. */
export const TICKET_MESSAGE_MAX_LENGTH = 4000;
