/** Responsável elegível pra um chamado (GET /tickets/assignees): ativo e com `tickets:manage`, sem e-mail. */
export interface TicketAssignee {
  /** Id do usuário. */
  id: string;
  /** Nome completo. */
  fullName: string;
  /** Setor do usuário. */
  sectorId: string | null;
  /** Nome do setor do usuário. */
  sectorName: string | null;
}
