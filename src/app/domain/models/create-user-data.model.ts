/** Dados para criação de colaborador/usuário. */
export interface CreateUserData {
  name: string;
  email: string;
  employeeCode: string;
  departmentId?: number;
  sectorId?: number;
  specialtyId?: number;
  roleId: number[];
  password?: string;
}
