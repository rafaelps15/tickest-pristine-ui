import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersStore } from '../application/users.store';

/** Tela de solicitação de cadastro: sem senha — o back-end envia um convite por e-mail pra pessoa criar a dela (spec 008). */
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

    /** Formulário reativo com validações robustas e tipagem implícita. */
    readonly form = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]]
    });

    ngOnInit(): void {
        this.store.resetState();
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
            lastName: raw.lastName!
        });
    }
}
