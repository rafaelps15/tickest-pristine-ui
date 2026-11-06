import { ValidatorFn, Validators } from '@angular/forms';
import { trimmed } from '../../shared';

/**
 * Validadores da descrição do chamado, na criação e na edição, com as regras de tamanho do back-end (10 a 500
 * caracteres). O obrigatório e o mínimo valem para o texto aparado, que é o enviado; o máximo, para o digitado, o
 * mesmo que o contador mostra.
 */
export const TICKET_DESCRIPTION_VALIDATORS: ValidatorFn[] = [trimmed(Validators.required), trimmed(Validators.minLength(10)), Validators.maxLength(500)];
