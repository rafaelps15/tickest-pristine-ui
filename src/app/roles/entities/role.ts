/** Modelo de dados da role, conforme retornado por GET /roles. */
export interface Role {
  id: string;
  name: string;
  permissionCodes: string[];
  isDefault: boolean;
  isAdministrator: boolean;
}
