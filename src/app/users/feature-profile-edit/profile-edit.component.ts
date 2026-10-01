import { Component, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileEditStore } from '../application/profile-edit.store';

/** Valida que a senha tem ao menos 1 maiúscula e 1 caractere especial (mesma regra do back-end). */
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  const errors: ValidationErrors = {};
  if (!/\p{Lu}/u.test(value)) errors['uppercase'] = true;
  if (!/[^\p{L}\p{N}\s]/u.test(value)) errors['specialChar'] = true;
  return Object.keys(errors).length ? errors : null;
}

/** Valida que a nova senha é diferente da atual (mesma regra do back-end) e que a confirmação bate. */
function passwordChangeGroupValidator(group: AbstractControl): ValidationErrors | null {
  const currentPassword = group.get('currentPassword')?.value;
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  const errors: ValidationErrors = {};
  if (currentPassword && newPassword && currentPassword === newPassword) errors['sameAsCurrent'] = true;
  if (newPassword !== confirmPassword) errors['mismatch'] = true;
  return Object.keys(errors).length ? errors : null;
}

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

  /** Formulário com as mesmas regras do UpdateUserProfileCommandValidator (nome e sobrenome obrigatórios). */
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]]
  });

  /** Formulário com as mesmas regras do ChangeUserPasswordCommandValidator. */
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), strongPasswordValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordChangeGroupValidator });

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
