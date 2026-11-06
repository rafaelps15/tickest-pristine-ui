import { FormControl, FormGroup } from '@angular/forms';
import { passwordChangeValidator, strongPasswordValidator } from './password.validators';

describe('password.validators', () => {
  describe('strongPasswordValidator', () => {
    it('accepts a password with an uppercase letter and a special character', () => {
      expect(strongPasswordValidator(new FormControl('Senha#1'))).toBeNull();
    });

    it('rejects a password without an uppercase letter', () => {
      expect(strongPasswordValidator(new FormControl('senha#1'))).toEqual({ uppercase: true });
    });

    it('rejects a password without a special character', () => {
      expect(strongPasswordValidator(new FormControl('Senha1'))).toEqual({ specialChar: true });
    });
  });

  describe('passwordChangeValidator', () => {
    /** Cria o grupo de troca de senha validado contra a senha atual informada. */
    function createGroup(currentPassword: string, newPassword: string, confirmPassword: string): FormGroup {
      return new FormGroup(
        { newPassword: new FormControl(newPassword), confirmPassword: new FormControl(confirmPassword) },
        { validators: passwordChangeValidator(() => currentPassword) }
      );
    }

    it('accepts a new password different from the current one and confirmed', () => {
      expect(createGroup('Atual#1', 'Nova#123', 'Nova#123').errors).toBeNull();
    });

    it('rejects a new password equal to the current one', () => {
      expect(createGroup('Atual#1', 'Atual#1', 'Atual#1').errors).toEqual({ sameAsCurrent: true });
    });

    it('rejects a confirmation different from the new password', () => {
      expect(createGroup('Atual#1', 'Nova#123', 'Outra#123').errors).toEqual({ mismatch: true });
    });
  });
});
