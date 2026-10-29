import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que a senha tem ao menos 1 maiúscula e 1 caractere especial (mesma regra do back-end). */
export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  const errors: ValidationErrors = {};
  if (!/\p{Lu}/u.test(value)) errors['uppercase'] = true;
  if (!/[^\p{L}\p{N}\s]/u.test(value)) errors['specialChar'] = true;
  return Object.keys(errors).length ? errors : null;
}

/**
 * Cria o validador de grupo da troca de senha: a nova senha precisa ser diferente da atual (mesma regra do back-end)
 * e a confirmação precisa bater. A senha atual vem de {@link getCurrentPassword}, que pode lê-la do próprio grupo
 * ou de outro lugar (ex.: a senha provisória guardada no primeiro acesso).
 */
export function passwordChangeValidator(
  getCurrentPassword: (group: AbstractControl) => string | null | undefined
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const currentPassword = getCurrentPassword(group);
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    const errors: ValidationErrors = {};
    if (currentPassword && newPassword && currentPassword === newPassword) errors['sameAsCurrent'] = true;
    if (newPassword !== confirmPassword) errors['mismatch'] = true;
    return Object.keys(errors).length ? errors : null;
  };
}
