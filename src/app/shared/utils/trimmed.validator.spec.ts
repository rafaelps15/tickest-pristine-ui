import { FormControl, Validators } from '@angular/forms';
import { trimmed } from './trimmed.validator';

describe('trimmed', () => {
  it('treats a text with only spaces as empty for required', () => {
    expect(trimmed(Validators.required)(new FormControl('   '))).toEqual({ required: true });
    expect(trimmed(Validators.required)(new FormControl(' a '))).toBeNull();
  });

  it('does not count the surrounding spaces toward the minimum length, keeping the minlength error', () => {
    expect(trimmed(Validators.minLength(10))(new FormControl('abc       '))).toEqual({ minlength: { requiredLength: 10, actualLength: 3 } });
    expect(trimmed(Validators.minLength(10))(new FormControl('  abcdefghij  '))).toBeNull();
  });

  it('passes a value that is not text to the validator as it is', () => {
    expect(trimmed(Validators.required)(new FormControl(null))).toEqual({ required: true });
    expect(trimmed(Validators.required)(new FormControl(0))).toBeNull();
  });
});
