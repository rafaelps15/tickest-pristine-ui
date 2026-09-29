import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';

/** Tela administrativa de gestão de roles e atribuição de permissões (RBAC). */
@Component({
    selector: 'app-role-list',
    imports: [ReactiveFormsModule],
    templateUrl: './role-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './role-list.component.css'
})
export class RoleListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(RolesStore);

    createForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]]
    });

    /** Role cujas permissões estão sendo editadas no modal. */
    selectedRole = signal<Role | null>(null);

    /** Conjunto (mutável) de códigos de permissão marcados no modal de atribuição. */
    selectedPermissionCodes = signal<Set<string>>(new Set());

    /** Carrega as roles e os códigos de permissão disponíveis ao abrir a tela. */
    ngOnInit(): void {
        this.store.load();
        this.store.loadPermissions();
    }

    /** Valida e envia o formulário de criação de uma nova role. */
    onCreateSubmit(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const name = this.createForm.getRawValue().name!;
        this.store.create(name, () => {
            this.createForm.reset({ name: '' });
            document.getElementById('roleCreateModalCloseButton')?.click();
        });
    }

    /** Abre o modal de atribuição de permissões pré-marcando as permissões já atribuídas à role. */
    openPermissionsModal(role: Role): void {
        this.selectedRole.set(role);
        this.selectedPermissionCodes.set(new Set(role.permissionCodes));
    }

    /** Indica se o código de permissão está marcado no modal de atribuição. */
    isChecked(code: string): boolean {
        return this.selectedPermissionCodes().has(code);
    }

    /** Marca ou desmarca um código de permissão no modal de atribuição. */
    togglePermission(code: string, checked: boolean): void {
        this.selectedPermissionCodes.update(current => {
            const next = new Set(current);
            if (checked) next.add(code); else next.delete(code);
            return next;
        });
    }

    /** Envia a atribuição de permissões marcadas para a role selecionada. */
    onAssignPermissionsSubmit(): void {
        const role = this.selectedRole();
        if (!role) return;

        this.store.assignPermissions(role.id, Array.from(this.selectedPermissionCodes()), () => {
            document.getElementById('rolePermissionsModalCloseButton')?.click();
        });
    }
}
