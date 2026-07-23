import { Component, inject, OnInit, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { UsersService } from '../../../../application/services/users.service';
import { RolesService } from '../../../../application/services/roles.service';
import { UserSummary } from '../../../../domain/models/user-summary.model';

/** Validador customizado para confirmar se as senhas coincidem. */
const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
        ? { passwordMismatch: true }
        : null;
};

/** Tela administrativa de gestão de usuários: listagem, criação e atribuição de roles. */
@Component({
    selector: 'app-user-list',
    imports: [ReactiveFormsModule],
    templateUrl: './user-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly usersService = inject(UsersService);
    protected readonly rolesService = inject(RolesService);

    createForm = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    /** Usuário selecionado para atribuição de roles. */
    selectedUser = signal<UserSummary | null>(null);

    /** Roles marcadas no modal de atribuição. */
    selectedRoleIds = signal<Set<string>>(new Set());

    constructor() {
        effect(() => {
            if (this.usersService.state().success) {
                this.createForm.reset({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
                document.getElementById('userCreateModalCloseButton')?.click();
            }
        });
    }

    ngOnInit(): void {
        this.usersService.resetState();
        this.usersService.loadAll();
        this.rolesService.load();
    }

    onCreateSubmit(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const raw = this.createForm.getRawValue();
        this.usersService.createUser({
            firstName: raw.firstName!,
            lastName: raw.lastName!,
            email: raw.email!,
            password: raw.password!
        });
    }

    openAssignRolesModal(user: UserSummary): void {
        this.selectedUser.set(user);
        this.selectedRoleIds.set(new Set(user.roles.map(role => role.id)));
    }

    isChecked(roleId: string): boolean {
        return this.selectedRoleIds().has(roleId);
    }

    toggleRole(roleId: string, checked: boolean): void {
        this.selectedRoleIds.update(current => {
            const next = new Set(current);
            if (checked) next.add(roleId); else next.delete(roleId);
            return next;
        });
    }

    onAssignRolesSubmit(): void {
        const user = this.selectedUser();
        if (!user) return;

        this.usersService.assignRoles(user.id, Array.from(this.selectedRoleIds()), () => {
            document.getElementById('userRolesModalCloseButton')?.click();
        });
    }
}
