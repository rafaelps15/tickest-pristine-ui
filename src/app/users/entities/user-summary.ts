/** Role resumida, como aninhada na resposta de listagem de usuários — identificada pelo nome, sem id. */
export interface UserRoleSummary {
  name: string;
}

/** Dados de perfil de um usuário, conforme retornado por GET /users/{id}. */
export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRoleSummary[];
  isActive: boolean;
  createdAtUtc: string;
  deactivatedAtUtc: string | null;
}
