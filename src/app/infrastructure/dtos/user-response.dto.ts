/** Role resumida, como aninhada na resposta de listagem/detalhe de usuários. */
export interface UserRoleSummaryDto {
  id: string;
  name: string;
}

/** Corpo de resposta de GET /users (cada item já traz as roles atribuídas). */
export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRoleSummaryDto[];
}
