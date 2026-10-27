/** Dados para cadastrar um usuário — sem senha: o back-end envia um convite por e-mail e a própria pessoa define a dela (spec 008). */
export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
}
