/** Corpo da requisição POST /users/register. */
export interface CreateUserRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
