import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Aplica o validador ao texto sem os espaços das pontas, que é o que vai para o back-end, com as mesmas
 * chaves de erro (`required`, `minlength`...): só espaços conta como vazio, e o mínimo não conta os espaços
 * das pontas. Valor que não é texto passa ao validador como está.
 */
export function trimmed(validator: ValidatorFn): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    typeof control.value === 'string' ? validator(new FormControl(control.value.trim())) : validator(control);
}
