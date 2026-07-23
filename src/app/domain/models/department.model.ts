/** Setor resumido, como aninhado na resposta de listagem de departamentos. */
export interface DepartmentSector {
    id: string;
    name: string;
}

/** Modelo de dados do departamento, conforme retornado por GET /departments. */
export interface Department {
    id: string;
    name: string;
    description: string;
    responsibleUserName: string | null;
    sectors: DepartmentSector[];
}

/** Dados para criação/atualização de um departamento. */
export interface DepartmentData {
    name: string;
    description: string;
    responsibleUserId?: string;
}
