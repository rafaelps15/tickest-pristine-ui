/** Dados para ativar a conta a partir do convite (POST /users/activation): token do link do e-mail e a senha escolhida pelo próprio usuário. */
export interface ActivateAccountData {
  token: string;
  newPassword: string;
}
