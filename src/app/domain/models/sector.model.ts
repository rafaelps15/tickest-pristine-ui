/** Modelo de dados do setor, conforme retornado por GET /sectors. */
export interface Sector {
    id: string;
    name: string;
    description: string | null;
    departmentId: string;
}

/** Dados para criação de um setor (POST /sectors). */
export interface CreateSectorData {
    name: string;
    description?: string;
    departmentId: string;
}

/** Dados para atualização de um setor (PUT /sectors/{sectorId}). */
export interface UpdateSectorData {
    name: string;
    description?: string;
}
