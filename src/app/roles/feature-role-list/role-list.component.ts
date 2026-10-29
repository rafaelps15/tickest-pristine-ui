import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';
import { ConfirmDialogService, ToastService } from '../../shared';
import { RoleGuideComponent } from './role-guide.component';
import { RoleInsightsComponent } from './role-insights.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';

/** Quantidade de badges de permissão exibidos antes de agrupar o restante em "+N". */
const MAX_VISIBLE_PERMISSION_BADGES = 2;

/** Situação das caixas de um grupo de permissões no diálogo: todas, algumas ou nenhuma marcada. */
export type PermissionGroupSelection = 'all' | 'some' | 'none';

/**
 * Tela administrativa das funções (RBAC): consulta e ajuste das permissões de cada uma. As funções
 * vêm do catálogo fixo do back-end — não há criar, renomear nem excluir por aqui.
 */
@Component({
    selector: 'app-role-list',
    imports: [PageHeaderComponent, RoleGuideComponent, RoleInsightsComponent, EmptyStateComponent, LoadingStateComponent, DialogComponent, RowActionsComponent],
    templateUrl: './role-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './role-list.component.css'
})
export class RoleListComponent implements OnInit {
    protected readonly store = inject(RolesStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly toastService = inject(ToastService);

    /** Diálogo aberto agora (renderizado com `@if`, via `<app-dialog>`), ou `null`. */
    protected readonly openDialog = signal<'permissions' | null>(null);

    /** Função cujas permissões estão abertas no diálogo. */
    readonly selectedRole = signal<Role | null>(null);

    /** Conjunto de códigos de permissão marcados no diálogo de permissões. */
    readonly selectedPermissionCodes = signal<Set<string>>(new Set());

    /** A função aberta é a de Administrador: as permissões dela são do sistema e o diálogo só mostra. */
    readonly permissionsReadOnly = computed(() => !!this.selectedRole()?.isAdministrator);

    /** Códigos marcados no diálogo que a função ainda não tem. */
    readonly addedPermissionCodes = computed(() => {
        const current = new Set(this.selectedRole()?.permissionCodes ?? []);
        return Array.from(this.selectedPermissionCodes()).filter(code => !current.has(code));
    });

    /** Códigos que a função tem e foram desmarcados no diálogo. */
    readonly removedPermissionCodes = computed(() =>
        (this.selectedRole()?.permissionCodes ?? []).filter(code => !this.selectedPermissionCodes().has(code)));

    /** Há alguma marcação diferente do que está salvo — habilita o "Salvar" e pede confirmação ao descartar. */
    readonly hasPermissionChanges = computed(() =>
        this.addedPermissionCodes().length + this.removedPermissionCodes().length > 0);

    /** Resumo do que mudou no diálogo, pro rodapé ("2 adicionadas e 1 removida"). */
    readonly permissionChangeSummary = computed(() => {
        const added = this.addedPermissionCodes().length;
        const removed = this.removedPermissionCodes().length;
        const parts = [
            added > 0 ? `${added} ${added === 1 ? 'adicionada' : 'adicionadas'}` : null,
            removed > 0 ? `${removed} ${removed === 1 ? 'removida' : 'removidas'}` : null
        ].filter(part => part !== null);
        return parts.length > 0 ? parts.join(' e ') : 'Nenhuma alteração';
    });

    /** "Salvar" do diálogo de permissões indisponível: catálogo sem carregar, envio em voo ou nada mudou. */
    readonly permissionsSaveBlocked = computed(() =>
        this.store.assigningPermissions()
        || this.store.permissions().length === 0
        || !this.hasPermissionChanges());

    /** Carrega as funções e o catálogo de permissões ao abrir a tela. */
    ngOnInit(): void {
        this.store.load();
        this.store.loadPermissions();
    }

    /** Fecha o diálogo aberto (X, Esc, clique fora, "Cancelar"/"Fechar" ou depois de salvar). */
    closeDialog(): void {
        this.openDialog.set(null);
    }

    /**
     * Pedido de fechar o diálogo de permissões: com marcações não salvas, confirma antes de
     * descartá-las; sem mudanças (ou só consultando), fecha direto.
     */
    requestClosePermissions(): void {
        const role = this.selectedRole();
        if (!role || this.permissionsReadOnly() || !this.hasPermissionChanges()) {
            this.closeDialog();
            return;
        }

        this.confirmDialogService.confirm({
            title: 'Descartar as alterações?',
            message: `As permissões marcadas em "${role.name}" não foram salvas.`,
            confirmLabel: 'Descartar',
            cancelLabel: 'Continuar editando',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.closeDialog();
        });
    }

    /** Abre o diálogo de permissões pré-marcando as que a função já tem (só leitura para o Administrador). */
    openPermissionsModal(role: Role): void {
        this.store.clearAssignPermissionsError();
        this.selectedRole.set(role);
        this.selectedPermissionCodes.set(new Set(role.permissionCodes));
        this.openDialog.set('permissions');
    }

    /** Até {@link MAX_VISIBLE_PERMISSION_BADGES} permissões exibidas como badge; o restante vira um badge "+N". */
    visiblePermissionCodes(role: Role): string[] {
        return role.permissionCodes.slice(0, MAX_VISIBLE_PERMISSION_BADGES);
    }

    /** Quantidade de permissões além das já exibidas como badge. */
    hiddenPermissionCount(role: Role): number {
        return Math.max(0, role.permissionCodes.length - MAX_VISIBLE_PERMISSION_BADGES);
    }

    /** Nomes amigáveis das permissões ocultas no badge "+N" (texto pro leitor de tela e tooltip do mouse). */
    hiddenPermissionNames(role: Role): string {
        return role.permissionCodes
            .slice(MAX_VISIBLE_PERMISSION_BADGES)
            .map(code => this.store.permissionName(code))
            .join(', ');
    }

    /** Indica se o código de permissão está marcado no diálogo de permissões. */
    isChecked(code: string): boolean {
        return this.selectedPermissionCodes().has(code);
    }

    /** A marcação dessa permissão difere do que está salvo na função (realçada no diálogo). */
    isPermissionChanged(code: string): boolean {
        return this.isChecked(code) !== (this.selectedRole()?.permissionCodes.includes(code) ?? false);
    }

    /** Marca ou desmarca um código de permissão no diálogo de permissões. */
    togglePermission(code: string, checked: boolean): void {
        this.selectedPermissionCodes.update(current => {
            const next = new Set(current);
            if (checked) next.add(code); else next.delete(code);
            return next;
        });
    }

    /** Quantas permissões de um grupo estão marcadas no diálogo. */
    groupCheckedCount(permissions: Permission[]): number {
        return permissions.filter(permission => this.isChecked(permission.code)).length;
    }

    /** Situação da caixa "Todas" de um grupo: todas, algumas (indeterminada) ou nenhuma marcada. */
    groupSelection(permissions: Permission[]): PermissionGroupSelection {
        const checked = this.groupCheckedCount(permissions);
        if (checked === 0) return 'none';
        return checked === permissions.length ? 'all' : 'some';
    }

    /** Marca ou desmarca de uma vez todas as permissões de um grupo. */
    toggleGroup(permissions: Permission[], checked: boolean): void {
        this.selectedPermissionCodes.update(current => {
            const next = new Set(current);
            for (const permission of permissions) {
                if (checked) next.add(permission.code); else next.delete(permission.code);
            }
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
        if (!role || this.permissionsReadOnly()) return;

        const removedAdministrativeCodes = this.removedPermissionCodes().filter(code =>
            this.store.permissions().find(permission => permission.code === code)?.isAdministrative
        );

        if (removedAdministrativeCodes.length > 0) {
            const names = removedAdministrativeCodes.map(code => this.store.permissionName(code)).join(', ');
            const plural = removedAdministrativeCodes.length > 1;
            this.confirmDialogService.confirm({
                title: `Remover permissão administrativa de "${role.name}"?`,
                message: `${names} ${plural ? 'são permissões administrativas' : 'é uma permissão administrativa'}. A mudança vale na hora para todos os usuários com essa função.`,
                confirmLabel: 'Remover',
                variant: 'danger'
            }).subscribe(confirmed => {
                if (confirmed) this.submitAssignPermissions(role);
            });
            return;
        }

        if (this.selectedPermissionCodes().size === 0) {
            this.confirmDialogService.confirm({
                title: `Salvar "${role.name}" sem nenhuma permissão?`,
                message: 'Quem tem essa função fica sem nenhum acesso liberado por ela. A mudança vale na hora para todos os usuários com essa função.',
                confirmLabel: 'Salvar sem permissões',
                variant: 'danger'
            }).subscribe(confirmed => {
                if (confirmed) this.submitAssignPermissions(role);
            });
            return;
        }

        this.submitAssignPermissions(role);
    }

    /** Envia a atribuição de permissões marcadas para a função selecionada. */
    private submitAssignPermissions(role: Role): void {
        this.store.assignPermissions(role.name, Array.from(this.selectedPermissionCodes()), () => {
            this.closeDialog();
            this.toastService.show(`Permissões da função "${role.name}" salvas.`);
        });
    }
}
