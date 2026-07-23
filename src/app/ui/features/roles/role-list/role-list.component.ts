import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../../../../application/services/roles.service';
import { PermissionsService } from '../../../../application/services/permissions.service';
import { Role } from '../../../../domain/models/role.model';

/** Tela administrativa de gestão de roles e atribuição de permissões (RBAC). */
@Component({
    selector: 'app-role-list',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './role-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './role-list.component.css'
})
export class RoleListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly rolesService = inject(RolesService);
    protected readonly permissionsService = inject(PermissionsService);

    createForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]]
    });

    /** Role cujas permissões estão sendo editadas no modal. */
    selectedRole = signal<Role | null>(null);

    /** Conjunto (mutável) de códigos de permissão marcados no modal de atribuição. */
    selectedPermissionCodes = signal<Set<string>>(new Set());

    ngOnInit(): void {
        this.rolesService.load();
        this.permissionsService.load();
    }

    onCreateSubmit(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const name = this.createForm.getRawValue().name!;
        this.rolesService.create(name, () => {
            this.createForm.reset({ name: '' });
            document.getElementById('roleCreateModalCloseButton')?.click();
        });
    }

    openPermissionsModal(role: Role): void {
        this.selectedRole.set(role);
        this.selectedPermissionCodes.set(new Set(role.permissionCodes));
    }

    isChecked(code: string): boolean {
        return this.selectedPermissionCodes().has(code);
    }

    togglePermission(code: string, checked: boolean): void {
        this.selectedPermissionCodes.update(current => {
            const next = new Set(current);
            if (checked) next.add(code); else next.delete(code);
            return next;
        });
    }

    onAssignPermissionsSubmit(): void {
        const role = this.selectedRole();
        if (!role) return;

        this.rolesService.assignPermissions(role.id, Array.from(this.selectedPermissionCodes()), () => {
            document.getElementById('rolePermissionsModalCloseButton')?.click();
        });
    }
}
