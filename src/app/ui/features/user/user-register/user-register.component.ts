import { Component, OnInit, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { UsersService } from "../../../../application/services/users.service";
import { RouterModule, Router } from '@angular/router';

/** Validador customizado para confirmar se as senhas coincidem. */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
        ? { passwordMismatch: true }
        : null;
};

@Component({
    selector: 'app-user-register',
    imports: [NgTemplateOutlet, ReactiveFormsModule, RouterModule],
    templateUrl: './user-register.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './user-register.component.css'
})
export class UserRegisterComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    protected readonly usersService = inject(UsersService);

    /** Determina se o componente está sendo usado para auto-registro ou dentro do painel administrativo. */
    isSelfRegistration = false;

    /** Formulário reativo com validações robustas e tipagem implícita. */
    readonly form = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    private redirectedAfterRegister = false;

    constructor() {
        // Redireciona para o login uma única vez após um auto-registro bem-sucedido.
        // Usar effect() em vez de polling: reage à mudança de estado e é destruído
        // automaticamente junto com o componente, sem deixar timers pendurados.
        effect(() => {
            const { success } = this.usersService.state();
            if (this.isSelfRegistration && success && !this.redirectedAfterRegister) {
                this.redirectedAfterRegister = true;
                setTimeout(() => this.router.navigate(['/login']), 2000);
            }
        });
    }

    ngOnInit(): void {
        this.usersService.resetState();

        // Verifica se a URL atual é de registro público ou administrativo
        this.isSelfRegistration = this.router.url.includes('/register');
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

        this.usersService.createUser({
            email: raw.email!,
            firstName: raw.firstName!,
            lastName: raw.lastName!,
            password: raw.password!
        });
    }
}
