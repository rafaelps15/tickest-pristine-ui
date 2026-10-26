import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersStore } from '../application/users.store';
import { strongPasswordValidator } from '../../shared';

/** Validador customizado para confirmar se as senhas coincidem. */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
        ? { passwordMismatch: true }
        : null;
};

/** Tela pública de solicitação de cadastro (auto-registro). */
@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    // Visual compartilhado com login/primeiro acesso (ver shared/ui/auth-form.css).
    styleUrls: ['../../shared/ui/auth-form.css']
})
export class RegisterComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(UsersStore);

    /** Controla a visibilidade dos dois campos de senha, juntos. */
    showPasswords = signal(false);

    /** Formulário reativo com validações robustas e tipagem implícita. */
    readonly form = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6), strongPasswordValidator]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    ngOnInit(): void {
        this.store.resetState();
    }

    /** Alterna entre exibir e ocultar os dois campos de senha. */
    togglePasswordsVisibility(): void {
        this.showPasswords.update(v => !v);
    }

    /** Atalho para facilitar o acesso aos controles no template. */
    get f() { return this.form.controls; }

    /** Verifica se um campo está inválido e foi tocado. */
    isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
        const control = this.form.get(fieldName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();

        this.store.createUser({
            email: raw.email!,
            firstName: raw.firstName!,
            lastName: raw.lastName!,
            password: raw.password!
        });
    }
}
