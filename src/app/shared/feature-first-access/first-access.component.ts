import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoginStore } from '../application/login.store';
import { passwordChangeValidator } from '../utils/password.validators';
import { NEW_PASSWORD_VALIDATORS } from '../utils/new-password.validators';
import { isControlInvalid } from '../utils/form-field.util';

/** Tela de primeiro acesso: troca a senha provisória antes de entrar no sistema. */
@Component({
  selector: 'app-first-access',
  imports: [ReactiveFormsModule],
  templateUrl: './first-access.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Visual compartilhado com a tela de login (ver shared/ui/auth-form.css).
  styleUrls: ['../ui/auth-form.css']
})
export class FirstAccessComponent {
  /** Construtor do formulário da nova senha. */
  private readonly fb = inject(FormBuilder);
  /** Store da sessão: credenciais pendentes e troca da senha provisória. */
  protected readonly store = inject(LoginStore);

  /** Controla se os campos de senha são exibidos em texto claro. */
  readonly showPasswords = signal(false);

  /** Formulário com as mesmas regras do ChangeRequiredUserPasswordCommandValidator; a senha atual é a provisória do login. */
  readonly form = this.fb.nonNullable.group({
    newPassword: ['', NEW_PASSWORD_VALIDATORS],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordChangeValidator(() => this.store.pendingCredentials()?.password) });

  /** Verifica se um campo está inválido e já foi tocado. */
  isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
    return isControlInvalid(this.form.controls[fieldName]);
  }

  /** Alterna a exibição em texto claro dos campos de senha. */
  togglePasswordsVisibility(): void {
    this.showPasswords.update(visible => !visible);
  }

  /** Envia a nova senha, ou marca os campos inválidos. */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.changeRequiredPassword(this.form.getRawValue().newPassword);
  }
}
