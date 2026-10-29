/** Dados para trocar a senha provisória no primeiro acesso. */
export interface ChangeRequiredPasswordData {
  /** E-mail da conta. */
  email: string;
  /** Senha provisória usada no login. */
  currentPassword: string;
  /** Nova senha definida pelo usuário. */
  newPassword: string;
}
