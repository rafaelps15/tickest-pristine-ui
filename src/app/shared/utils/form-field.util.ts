import { AbstractControl } from '@angular/forms';

/**
 * Se o campo está inválido e a pessoa já mexeu nele (alterou ou saiu dele): a regra de quando o erro do campo
 * aparece, a mesma em todos os formulários. Sem campo, `false`.
 */
export function isControlInvalid(control: AbstractControl | null | undefined): boolean {
  return !!control && control.invalid && (control.dirty || control.touched);
}
