/** Role resumida do usuário logado, conforme retornado por GET /users/me — identificada pelo nome, sem id. */
export interface CurrentUserRole {
  name: string;
}

/** Usuário logado, com roles e permissões — mesma fonte que a autorização da API usa (GET /users/me). */
export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: CurrentUserRole[];
  permissions: string[];
}
