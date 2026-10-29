import { Component, inject, effect, signal, untracked, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileEditStore } from '../application/profile-edit.store';
import { USER_NAME_MAX_LENGTH } from '../entities/user-profile';
import { ToastService, passwordChangeValidator, strongPasswordValidator } from '../../shared';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';

/** Tela de edição do perfil do usuário logado (nome e sobrenome). */
@Component({
  selector: 'app-profile-edit',
  imports: [ReactiveFormsModule, RouterModule, PageHeaderComponent, LoadingStateComponent],
  templateUrl: './profile-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileEditComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(ProfileEditStore);
  private readonly toastService = inject(ToastService);

  /** Limite de nome e sobrenome nos campos, o mesmo do back-end. */
  protected readonly nameMaxLength = USER_NAME_MAX_LENGTH;

  /** Formulário com as regras do UpdateUserProfileCommandValidator (até {@link USER_NAME_MAX_LENGTH} caracteres) e mínimo de 2 caracteres. */
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(USER_NAME_MAX_LENGTH)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(USER_NAME_MAX_LENGTH)]]
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

    // Sucesso vira toast (mesmo retorno de Chamados e Usuários) e o estado é limpo na hora — um
    // alerta inline ficava na tela e dava falsa confiança se o usuário voltasse a editar.
    effect(() => {
      if (!this.store.saved()) return;
      untracked(() => {
        this.toastService.show('Perfil atualizado.');
        this.store.clearSaved();
      });
    });

    // Limpa o formulário de senha após uma troca bem-sucedida, avisando por toast.
    effect(() => {
      if (!this.store.passwordChanged()) return;
      untracked(() => {
        this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.toastService.show('Senha alterada.');
        this.store.clearPasswordChanged();
      });
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
