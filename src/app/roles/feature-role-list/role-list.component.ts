import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';
import { ConfirmDialogService } from '../../shared';

/** Quantidade de badges de permissão exibidos antes de agrupar o restante em "+N". */
const MAX_VISIBLE_PERMISSION_BADGES = 2;

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
    private readonly confirmDialogService = inject(ConfirmDialogService);

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

    /** Prepara o modal de criação, limpando o erro de uma tentativa anterior. */
    openCreateModal(): void {
        this.store.clearCreateError();
        this.createForm.reset({ name: '' });
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
        this.store.clearAssignPermissionsError();
        this.selectedRole.set(role);
        this.selectedPermissionCodes.set(new Set(role.permissionCodes));
    }

    /** Até {@link MAX_VISIBLE_PERMISSION_BADGES} permissões exibidas como badge; o restante vira um badge "+N". */
    visiblePermissionCodes(role: Role): string[] {
        return role.permissionCodes.slice(0, MAX_VISIBLE_PERMISSION_BADGES);
    }

    /** Quantidade de permissões além das já exibidas como badge. */
    hiddenPermissionCount(role: Role): number {
        return Math.max(0, role.permissionCodes.length - MAX_VISIBLE_PERMISSION_BADGES);
    }

    /** Nomes amigáveis das permissões ocultas no badge "+N", para exibir no `title` (tooltip nativo). */
    hiddenPermissionNames(role: Role): string {
        return role.permissionCodes
            .slice(MAX_VISIBLE_PERMISSION_BADGES)
            .map(code => this.store.permissionName(code))
            .join(', ');
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

    /**
     * Valida se alguma permissão administrativa está sendo removida e, se sim, pede confirmação
     * extra antes de enviar — essa mudança afeta todo mundo que tem a função, não só quem está
     * editando. Sem permissão administrativa removida, envia direto.
     */
    onAssignPermissionsSubmit(): void {
        const role = this.selectedRole();
        if (!role) return;

        const removedAdministrativeCodes = role.permissionCodes.filter(code =>
            !this.isChecked(code) && this.store.permissions().find(permission => permission.code === code)?.isAdministrative
        );

        if (removedAdministrativeCodes.length === 0) {
            this.submitAssignPermissions(role);
            return;
        }

        const names = removedAdministrativeCodes.map(code => this.store.permissionName(code)).join(', ');
        const plural = removedAdministrativeCodes.length > 1;
        this.confirmDialogService.confirm({
            title: `Remover permissão administrativa de "${role.name}"?`,
            message: `${names} ${plural ? 'são permissões administrativas' : 'é uma permissão administrativa'}. Isso afeta todos os usuários que têm essa função, não só você.`,
            confirmLabel: 'Remover',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.submitAssignPermissions(role);
        });
    }

    /** Envia a atribuição de permissões marcadas para a role selecionada. */
    private submitAssignPermissions(role: Role): void {
        this.store.assignPermissions(role.name, Array.from(this.selectedPermissionCodes()), () => {
            document.getElementById('rolePermissionsModalCloseButton')?.click();
        });
    }
}
