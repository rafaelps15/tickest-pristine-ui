import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
        name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        employeeCode: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        departmentId: [''],
        sectorId: [''],
        specialtyId: [''],
        roleId: [''] // Removida obrigatoriedade pois o campo foi removido da tela
    }, { validators: passwordMatchValidator });

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
            name: raw.name!,
            email: raw.email!,
            employeeCode: raw.employeeCode!,
            roleId: raw.roleId ? [Number(raw.roleId)] : [], // Envia array vazio ou com o ID se disponível
            password: raw.password!,
            departmentId: raw.departmentId ? Number(raw.departmentId) : undefined,
            sectorId: raw.sectorId ? Number(raw.sectorId) : undefined,
            specialtyId: raw.specialtyId ? Number(raw.specialtyId) : undefined
        }, this.isSelfRegistration);

        if (this.isSelfRegistration) {
            // Efeito de redirecionamento após sucesso (apenas para auto-registro)
            const checkSuccess = setInterval(() => {
                if (this.usersService.state().success) {
                    clearInterval(checkSuccess);
                    setTimeout(() => this.router.navigate(['/login']), 2000);
                }
            }, 500);
        }
    }
}

