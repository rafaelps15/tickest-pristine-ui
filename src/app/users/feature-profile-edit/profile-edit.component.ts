import { Component, inject, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileEditStore } from '../application/profile-edit.store';
import { passwordChangeValidator, strongPasswordValidator } from '../../shared';

/** Tela de edição do perfil do usuário logado (nome e sobrenome). */
@Component({
  selector: 'app-profile-edit',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './profile-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileEditComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(ProfileEditStore);

  /** Formulário com as mesmas regras do UpdateUserProfileCommandValidator, mais o limite de tamanho já usado no cadastro administrativo. */
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
  });

  /** Formulário com as mesmas regras do ChangeUserPasswordCommandValidator. */
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), strongPasswordValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordChangeValidator(group => group.get('currentPassword')?.value) });

  /** Controla se os três campos de senha são exibidos em texto claro. */
  readonly showPasswords = signal(false);

  constructor() {
    this.store.loadCurrentUser();

    // Preenche o formulário sempre que o perfil (re)carregar do servidor.
    effect(() => {
      const profile = this.store.profile();
      if (profile) {
        this.form.reset({ firstName: profile.firstName, lastName: profile.lastName });
      }
    });

    // Limpa o formulário de senha após uma troca bem-sucedida.
    effect(() => {
      if (this.store.passwordChanged()) {
        this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    });

    // Esconde a confirmação de sucesso assim que o usuário volta a editar, para não dar falsa
    // confiança de que uma mudança ainda não salva já foi aplicada. Checa `dirty` porque o
    // próprio reset() dos efeitos acima (ao recarregar o perfil/limpar a senha) também emite
    // valueChanges, mas deixa o formulário pristine — não é uma edição do usuário.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.store.saved() && this.form.dirty) this.store.clearSaved();
    });
    this.passwordForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.store.passwordChanged() && this.passwordForm.dirty) this.store.clearPasswordChanged();
    });
  }

  /** Verifica se um campo está inválido e já foi tocado. */
  isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  /** Verifica se um campo do formulário de senha está inválido e já foi tocado. */
  isPasswordFieldInvalid(fieldName: keyof typeof this.passwordForm.controls): boolean {
    const control = this.passwordForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  /** Envia as alterações do perfil, ou marca os campos inválidos. */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName } = this.form.getRawValue();
    this.store.save({ firstName: firstName.trim(), lastName: lastName.trim() });
  }

  /** Alterna a exibição em texto claro dos três campos de senha. */
  togglePasswordsVisibility(): void {
    this.showPasswords.update(visible => !visible);
  }

  /** Envia a troca de senha, ou marca os campos inválidos. */
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.store.changePassword({ currentPassword, newPassword });
  }
}
