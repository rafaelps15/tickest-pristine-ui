/** Status do ciclo de vida de um ticket (espelha TicketStatus no back-end). */
export enum TicketStatus {
  Open = 1,
  InProgress = 2,
  Resolved = 3,
  Closed = 4,
  Canceled = 5
}

/** Rótulo em português para exibição. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Aberto',
  [TicketStatus.InProgress]: 'Em Andamento',
  [TicketStatus.Resolved]: 'Resolvido',
  [TicketStatus.Closed]: 'Fechado',
  [TicketStatus.Canceled]: 'Cancelado'
};

/** Classe de badge Bootstrap por status, para exibição consistente nas listas. */
export const TICKET_STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'bg-label-warning',
  [TicketStatus.InProgress]: 'bg-label-info',
  [TicketStatus.Resolved]: 'bg-label-success',
  [TicketStatus.Closed]: 'bg-label-secondary',
  [TicketStatus.Canceled]: 'bg-label-danger'
};

/** Status em que o ticket ainda está ativo (aceita atribuir/remover responsável). */
export const TICKET_ACTIVE_STATUSES: ReadonlySet<TicketStatus> = new Set([TicketStatus.Open, TicketStatus.InProgress]);

/**
 * Transições de status válidas a partir de cada status atual (PUT /tickets/{id}), espelhando o
 * fluxo documentado do produto: Aberto → Em Andamento → Resolvido → Fechado, com Cancelamento a
 * partir de qualquer status ativo. Reabertura (Resolvido/Fechado/Cancelado → Aberto) não é uma
 * transição de `update()` — é o endpoint dedicado `POST /tickets/{id}/reopen`, por isso não entra
 * aqui (ver {@link TICKET_ACTIVE_STATUSES} e o método `reopen` do `TicketDetailStore`).
 */
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.Open]: [TicketStatus.InProgress, TicketStatus.Canceled],
  [TicketStatus.InProgress]: [TicketStatus.Resolved, TicketStatus.Canceled],
  [TicketStatus.Resolved]: [TicketStatus.Closed],
  [TicketStatus.Closed]: [],
  [TicketStatus.Canceled]: []
};

/** Rótulo do botão que leva a cada status (a ação, não o nome do status — "Controles nomeiam a própria ação"). */
export const TICKET_STATUS_ACTION_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Reabrir chamado',
  [TicketStatus.InProgress]: 'Iniciar atendimento',
  [TicketStatus.Resolved]: 'Marcar como resolvido',
  [TicketStatus.Closed]: 'Fechar chamado',
  [TicketStatus.Canceled]: 'Cancelar chamado'
};
