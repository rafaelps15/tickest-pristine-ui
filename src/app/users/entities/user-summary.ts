/** Role resumida, como aninhada na resposta de listagem de usuários. */
export interface UserRoleSummary {
  id: string;
  name: string;
}

/** Dados de perfil de um usuário, conforme retornado por GET /users/{id}. */
export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRoleSummary[];
}
