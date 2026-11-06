import { ValidatorFn, Validators } from '@angular/forms';
import { strongPasswordValidator } from './password.validators';

/**
 * Validadores da senha nova nas três telas de troca (ativar conta, primeiro acesso, perfil), com as regras do
 * back-end: obrigatória, com 6 caracteres no mínimo, 1 maiúscula e 1 caractere especial.
 */
export const NEW_PASSWORD_VALIDATORS: ValidatorFn[] = [Validators.required, Validators.minLength(6), strongPasswordValidator];
