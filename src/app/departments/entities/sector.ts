/** Dados para criação de um setor dentro de um departamento (POST /sectors). */
export interface CreateSectorData {
  /** Nome do setor. */
  name: string;
  /** Descrição do setor (opcional). */
  description?: string;
  /** Departamento ao qual o setor pertence. */
  departmentId: string;
}

/** Dados para atualização de um setor (PUT /sectors/{sectorId}); o departamento não muda. */
export interface UpdateSectorData {
  /** Nome do setor. */
  name: string;
  /** Descrição do setor (opcional). */
  description?: string;
}
