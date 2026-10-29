/** De quem um chamado ativo está esperando ação (espelha a situação de espera da spec 029 do back-end). */
export enum TicketAwaiting {
  /** A última mensagem é de quem atende: a vez é do solicitante. */
  Requester = 1,
  /** A última mensagem é do solicitante, ou ninguém da equipe respondeu ainda. */
  Agent = 2
}

/** Rótulo em português para exibição. */
export const TICKET_AWAITING_LABELS: Record<TicketAwaiting, string> = {
  [TicketAwaiting.Requester]: 'Aguardando o solicitante',
  [TicketAwaiting.Agent]: 'Aguardando a equipe'
};
