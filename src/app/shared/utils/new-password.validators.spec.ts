import { FormControl } from '@angular/forms';
import { NEW_PASSWORD_VALIDATORS } from './new-password.validators';

describe('NEW_PASSWORD_VALIDATORS', () => {
  /** Erros da senha nova com o valor dado. */
  function errorsFor(value: string) {
    return new FormControl(value, NEW_PASSWORD_VALIDATORS).errors;
  }

  it('accepts a password with 6 characters, an uppercase letter and a special character', () => {
    expect(errorsFor('Senha#')).toBeNull();
  });

  it('requires the password', () => {
    expect(errorsFor('')).toEqual(jasmine.objectContaining({ required: true }));
  });

  it('rejects fewer than 6 characters, a missing uppercase letter and a missing special character', () => {
    expect(errorsFor('Se#1')).toEqual({ minlength: { requiredLength: 6, actualLength: 4 } });
    expect(errorsFor('senha#1')).toEqual({ uppercase: true });
    expect(errorsFor('Senha12')).toEqual({ specialChar: true });
  });
});
