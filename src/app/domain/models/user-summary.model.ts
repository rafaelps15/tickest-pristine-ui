/** Dados de perfil de um usuário, conforme retornado por GET /users/{id}. */
export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}
