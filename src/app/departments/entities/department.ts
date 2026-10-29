/** Setor ativo do departamento, como aninhado na resposta de listagem de departamentos. */
export interface DepartmentSector {
  id: string;
  name: string;
  description: string | null;
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

/**
 * Departamento com o id do responsável, conforme GET /departments/{id} — a listagem (GET
 * /departments) só traz o nome dele (`responsibleUserName`), não o id, então editar o responsável
 * de um departamento existente precisa buscar o detalhe primeiro.
 */
export interface DepartmentDetail {
  id: string;
  name: string;
  description: string;
  responsibleUserId: string | null;
}
