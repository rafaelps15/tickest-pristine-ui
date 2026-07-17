/** Corpo de resposta de POST /users/login e POST /users/refresh-token. */
export interface AccessTokensResponseDto {
  accessToken: string;
  refreshToken: string;
}
