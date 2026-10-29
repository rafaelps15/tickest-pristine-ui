/** Grupo de status de "Meus Chamados" no filtro de GET /tickets/mine (espelha OwnTicketStatusGroup no back-end). */
export enum TicketStatusGroup {
  /** Em aberto: Aberto e Em Andamento. */
  Active = 1,
  /** Encerrados: Resolvido, Fechado e Cancelado. */
  Finished = 2
}

/** Valor do grupo na URL da tela (`?status=`); "Em aberto" é o padrão e não aparece na URL. */
export const TICKET_STATUS_GROUP_URL_VALUES: Record<'active' | 'finished' | 'all', TicketStatusGroup | null> = {
  active: TicketStatusGroup.Active,
  finished: TicketStatusGroup.Finished,
  all: null
};
