/** Setor ativo do departamento, como aninhado na resposta de listagem de departamentos. */
export interface DepartmentSector {
  /** Id do setor. */
  id: string;
  /** Nome do setor. */
  name: string;
  /** Descrição do setor (opcional). */
  description: string | null;
  /** Chamados em aberto ou em andamento no setor (spec 022): com algum, o back-end recusa desativá-lo. */
  activeTicketCount: number;
}

/** Modelo de dados do departamento, conforme retornado por GET /departments. */
export interface Department {
  /** Id do departamento. */
  id: string;
  /** Nome do departamento. */
  name: string;
  /** Descrição do departamento. */
  description: string;
  /** Id do usuário responsável, ou `null` quando não há responsável. */
  responsibleUserId: string | null;
  /** Nome do responsável, ou `null` quando não há responsável. */
  responsibleUserName: string | null;
  /**
   * Chamados em aberto ou em andamento nos setores do departamento, inclusive nos desativados (spec 022): com algum,
   * o back-end recusa desativá-lo.
   */
  activeTicketCount: number;
  /** Setores ativos do departamento. */
  sectors: DepartmentSector[];
}

/** Dados para criação/atualização de um departamento. */
export interface DepartmentData {
  /** Nome do departamento. */
  name: string;
  /** Descrição do departamento. */
  description: string;
  /** Id do usuário responsável (ausente = sem responsável). */
  responsibleUserId?: string;
}
