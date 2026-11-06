import { FormControl, FormGroup, Validators } from '@angular/forms';
import { isControlInvalid } from './form-field.util';

describe('isControlInvalid', () => {
  it('only reports an invalid field after it was touched or changed', () => {
    const control = new FormControl('', Validators.required);
    expect(isControlInvalid(control)).toBeFalse();

    control.markAsTouched();
    expect(isControlInvalid(control)).toBeTrue();

    const changed = new FormControl('', Validators.required);
    changed.markAsDirty();
    expect(isControlInvalid(changed)).toBeTrue();
  });

  it('does not report a valid field, even after it was touched', () => {
    const control = new FormControl('Texto', Validators.required);
    control.markAsTouched();
    control.markAsDirty();

    expect(isControlInvalid(control)).toBeFalse();
  });

  it('treats a missing field as valid', () => {
    const form = new FormGroup({ name: new FormControl('') });

    expect(isControlInvalid(form.get('email'))).toBeFalse();
    expect(isControlInvalid(undefined)).toBeFalse();
  });
});
