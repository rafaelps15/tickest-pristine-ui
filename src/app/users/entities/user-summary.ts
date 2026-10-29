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
  /** Cadastrado e ativo, mas ainda sem senha: não ativou a conta pelo convite por e-mail (spec 008 do back-end). */
  pendingActivation: boolean;
  /** Validade do último convite utilizável; `null` se não houver (expirado, revogado ou conta já ativada). */
  invitationExpiresAtUtc: string | null;
}
