/** Role resumida do usuário logado, conforme retornado por GET /users/me — identificada pelo nome, sem id. */
export interface CurrentUserRole {
  /** Nome da função. */
  name: string;
}

/** Usuário logado, com roles e permissões — mesma fonte que a autorização da API usa (GET /users/me). */
export interface CurrentUser {
  /** Id do usuário. */
  id: string;
  /** E-mail de acesso. */
  email: string;
  /** Primeiro nome. */
  firstName: string;
  /** Sobrenome. */
  lastName: string;
  /** Funções atribuídas ao usuário. */
  roles: CurrentUserRole[];
  /** Códigos das permissões efetivas (ex.: `tickets:manage`). */
  permissions: string[];
}

/** Por que o usuário logado não pôde ser carregado, numa falha passageira: limite de requisições, sem conexão ou servidor fora. */
export type SessionUnavailableReason = 'rate-limited' | 'offline' | 'server-error';

/**
 * Resultado de carregar o usuário logado (GET /users/me): `loaded`; `unauthenticated` (a API recusou
 * a sessão); ou `unavailable` (falha passageira: a sessão pode continuar válida e dá pra tentar de novo).
 */
export type CurrentUserLoadResult =
  | { status: 'loaded' }
  | { status: 'unauthenticated' }
  | { status: 'unavailable'; reason: SessionUnavailableReason };
