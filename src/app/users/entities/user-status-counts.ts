/**
 * Quantos usuários a empresa tem em cada situação (GET /users/stats/status, spec 020 do back-end).
 * As três situações são disjuntas e somam {@link totalCount}.
 */
export interface UserStatusCounts {
  /** Todos os usuários cadastrados. */
  totalCount: number;
  /** Ativos que já criaram a senha (entram no sistema). */
  activeCount: number;
  /** Ativos ainda sem senha — convite pendente ou expirado. */
  pendingActivationCount: number;
  /** Desativados, com ou sem senha (login bloqueado). */
  inactiveCount: number;
}
