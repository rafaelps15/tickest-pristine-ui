/** Dados para criação de um setor dentro de um departamento (POST /sectors). */
export interface CreateSectorData {
  name: string;
  description?: string;
  departmentId: string;
}

/** Dados para atualização de um setor (PUT /sectors/{sectorId}); o departamento não muda. */
export interface UpdateSectorData {
  name: string;
  description?: string;
}
