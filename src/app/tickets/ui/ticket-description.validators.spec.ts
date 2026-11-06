import { FormControl } from '@angular/forms';
import { TICKET_DESCRIPTION_VALIDATORS } from './ticket-description.validators';

describe('TICKET_DESCRIPTION_VALIDATORS', () => {
  /** Erros da descrição com o valor dado. */
  function errorsFor(value: string) {
    return new FormControl(value, TICKET_DESCRIPTION_VALIDATORS).errors;
  }

  it('accepts a description from 10 to 500 characters', () => {
    expect(errorsFor('Impressora')).toBeNull();
    expect(errorsFor('a'.repeat(500))).toBeNull();
  });

  it('counts the required and the minimum without the spaces at the ends', () => {
    expect(errorsFor('   ')).toEqual(jasmine.objectContaining({ required: true }));
    expect(errorsFor('  Curta     ')).toEqual({ minlength: { requiredLength: 10, actualLength: 5 } });
  });

  it('counts the maximum on the typed text, as the counter shows it', () => {
    expect(errorsFor(`${'a'.repeat(499)} `)).toBeNull();
    expect(errorsFor(`${'a'.repeat(499)}  `)).toEqual({ maxlength: { requiredLength: 500, actualLength: 501 } });
  });
});
