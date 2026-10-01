/** Permissão disponível no sistema, conforme retornado por GET /permissions. */
export interface Permission {
  code: string;
  name: string;
  description: string;
  group: string;
  isAdministrative: boolean;
}
