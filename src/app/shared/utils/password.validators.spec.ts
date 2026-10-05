import { FormControl, FormGroup } from '@angular/forms';
import { passwordChangeValidator, strongPasswordValidator } from './password.validators';

describe('password.validators', () => {
  describe('strongPasswordValidator', () => {
    it('deve aceitar senha com maiúscula e caractere especial', () => {
      expect(strongPasswordValidator(new FormControl('Senha#1'))).toBeNull();
    });

    it('deve recusar senha sem letra maiúscula', () => {
      expect(strongPasswordValidator(new FormControl('senha#1'))).toEqual({ uppercase: true });
    });

    it('deve recusar senha sem caractere especial', () => {
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

    it('deve aceitar nova senha diferente da atual e confirmada', () => {
      expect(createGroup('Atual#1', 'Nova#123', 'Nova#123').errors).toBeNull();
    });

    it('deve recusar nova senha igual à atual', () => {
      expect(createGroup('Atual#1', 'Atual#1', 'Atual#1').errors).toEqual({ sameAsCurrent: true });
    });

    it('deve recusar confirmação diferente da nova senha', () => {
      expect(createGroup('Atual#1', 'Nova#123', 'Outra#123').errors).toEqual({ mismatch: true });
    });
  });
});
