/** Perfil do usuário, conforme retornado por GET /users/{id} (UserResponse no back-end). */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Corpo de PUT /users/{id}/profile (espelha UpdateUserProfileCommand no back-end). */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

/** Corpo de PUT /users/me/password (espelha ChangeUserPasswordCommand no back-end). */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
