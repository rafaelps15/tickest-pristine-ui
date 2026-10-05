/** Modelo de dados da role, conforme retornado por GET /roles — identificada pelo nome, sem id. */
export interface Role {
  name: string;
  permissionCodes: string[];
  isDefault: boolean;
  isAdministrator: boolean;
}
