import { Component, inject, OnInit, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsersStore } from '../application/users.store';
import { UserSummary, UserRoleSummary } from '../entities/user-summary';
import { UserStatus } from '../entities/user-filters';
import { RolesStore } from '../../roles';
import { SessionService, ConfirmDialogService, ToastService } from '../../shared';
import { DropdownFixedPositionDirective } from '../../shared/ui/directives/dropdown-fixed-position.directive';

/** Quantidade de badges de função exibidos antes de agrupar o restante em "+N". */
const MAX_VISIBLE_ROLE_BADGES = 2;

/** Validador customizado para confirmar se as senhas coincidem. */
const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
        ? { passwordMismatch: true }
        : null;
};

/** Tela administrativa de gestão de usuários: listagem paginada/filtrada, criação, edição, roles e ativação/desativação. */
@Component({
    selector: 'app-user-list',
    imports: [ReactiveFormsModule, DatePipe, DropdownFixedPositionDirective],
    templateUrl: './user-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(UsersStore);
    protected readonly rolesStore = inject(RolesStore);
    private readonly sessionService = inject(SessionService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly toastService = inject(ToastService);

    createForm = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    /** Formulário de edição de nome/sobrenome do usuário selecionado. */
    editForm = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });

    /** Usuário selecionado para atribuição de roles. */
    selectedUser = signal<UserSummary | null>(null);

    /** Usuário selecionado para edição de cadastro (nome/sobrenome). */
    selectedUserForEdit = signal<UserSummary | null>(null);

    /** Roles marcadas no modal de atribuição (por nome). */
    selectedRoleNames = signal<Set<string>>(new Set());

    /** Controla se os campos de senha do modal de criação são exibidos em texto claro. */
    showPasswords = signal(false);

    /** Texto digitado na busca, antes do debounce — ver o effect de busca no construtor. */
    searchInput = signal('');

    readonly pageSizeOptions = [10, 20, 50, 100];

    constructor() {
        effect(() => {
            if (this.store.success()) {
                this.createForm.reset({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
                document.getElementById('userCreateModalCloseButton')?.click();
            }
        });

        // Espera ~300ms após a última tecla antes de disparar a busca, pra não buscar a cada letra digitada.
        toObservable(this.searchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.setSearch(search));
    }

    ngOnInit(): void {
        this.store.resetState();
        this.store.loadAll();
        this.rolesStore.load();
    }

    onCreateSubmit(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const raw = this.createForm.getRawValue();
        this.store.createUser({
            firstName: raw.firstName!,
            lastName: raw.lastName!,
            email: raw.email!,
            password: raw.password!
        });
    }

    /** Abre o modal de edição de cadastro pré-preenchendo nome/sobrenome do usuário selecionado. */
    openEditModal(user: UserSummary): void {
        this.store.clearListMutationError();
        this.selectedUserForEdit.set(user);
        this.editForm.reset({ firstName: user.firstName, lastName: user.lastName });
    }

    /** Valida e envia a atualização de cadastro (nome/sobrenome) do usuário selecionado. */
    onEditSubmit(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        const user = this.selectedUserForEdit();
        if (!user) return;

        const { firstName, lastName } = this.editForm.getRawValue();
        this.store.updateProfile(user.id, { firstName: firstName!.trim(), lastName: lastName!.trim() }, () => {
            document.getElementById('userEditModalCloseButton')?.click();
        });
    }

    /** Alterna a exibição em texto claro dos campos de senha do modal de criação. */
    togglePasswordsVisibility(): void {
        this.showPasswords.update(visible => !visible);
    }

    /** Abre o modal de atribuição de roles pré-marcando as roles já atribuídas ao usuário selecionado. */
    openAssignRolesModal(user: UserSummary): void {
        this.store.clearListMutationError();
        this.selectedUser.set(user);
        this.selectedRoleNames.set(new Set(user.roles.map(role => role.name)));
    }

    isChecked(roleName: string): boolean {
        return this.selectedRoleNames().has(roleName);
    }

    toggleRole(roleName: string, checked: boolean): void {
        this.selectedRoleNames.update(current => {
            const next = new Set(current);
            if (checked) next.add(roleName); else next.delete(roleName);
            return next;
        });
    }

    onAssignRolesSubmit(): void {
        const user = this.selectedUser();
        if (!user) return;

        this.store.assignRoles(user.id, Array.from(this.selectedRoleNames()), () => {
            document.getElementById('userRolesModalCloseButton')?.click();
            this.toastService.show(`Funções de "${user.firstName} ${user.lastName}" atualizadas.`);
        });
    }

    /** Verifica se o usuário está desativado. */
    isInactive(user: UserSummary): boolean {
        return !user.isActive;
    }

    /** Até {@link MAX_VISIBLE_ROLE_BADGES} funções exibidas como badge; o restante vira um badge "+N". */
    visibleRoles(user: UserSummary): UserRoleSummary[] {
        return user.roles.slice(0, MAX_VISIBLE_ROLE_BADGES);
    }

    /** Quantidade de funções além das já exibidas como badge. */
    hiddenRolesCount(user: UserSummary): number {
        return Math.max(0, user.roles.length - MAX_VISIBLE_ROLE_BADGES);
    }

    /** Nomes das funções ocultas no badge "+N", para exibir no `title` (tooltip nativo). */
    hiddenRolesNames(user: UserSummary): string {
        return user.roles.slice(MAX_VISIBLE_ROLE_BADGES).map(role => role.name).join(', ');
    }

    /** Impede desativar/reativar a própria conta logada, que travaria a sessão atual sem recuperação pela UI. */
    isCurrentUser(user: UserSummary): boolean {
        return user.id === this.sessionService.userId();
    }

    /** Confirma e desativa o usuário selecionado, bloqueando o login dele. */
    onDeactivate(user: UserSummary): void {
        this.confirmDialogService.confirm({
            title: `Desativar "${user.firstName} ${user.lastName}"?`,
            message: 'O login dele será bloqueado imediatamente.',
            confirmLabel: 'Desativar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.store.deactivate(user.id, () => {
                    this.toastService.show(`"${user.firstName} ${user.lastName}" foi desativado.`);
                });
            }
        });
    }

    /** Confirma e reativa o usuário selecionado, liberando o login dele de novo. */
    onActivate(user: UserSummary): void {
        this.confirmDialogService.confirm({
            title: `Reativar "${user.firstName} ${user.lastName}"?`,
            message: 'O login dele voltará a funcionar.',
            confirmLabel: 'Reativar',
            variant: 'success'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.store.activate(user.id, () => {
                    this.toastService.show(`"${user.firstName} ${user.lastName}" foi reativado.`);
                });
            }
        });
    }

    /** Muda o filtro de status da listagem. */
    onStatusChange(status: UserStatus): void {
        this.store.setStatus(status);
    }

    /** Muda a data inicial do período de cadastro. */
    onCreatedFromChange(value: string): void {
        this.store.setPeriod(value || undefined, this.store.filters().createdTo);
    }

    /** Muda a data final do período de cadastro. */
    onCreatedToChange(value: string): void {
        this.store.setPeriod(this.store.filters().createdFrom, value || undefined);
    }

    /** Muda a quantidade de itens exibidos por página. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Limpa todos os filtros, incluindo o campo de busca local. */
    onClearFilters(): void {
        this.searchInput.set('');
        this.store.clearFilters();
    }

    /** Índice (1-based) do primeiro item exibido na página atual, para o texto "Exibindo X–Y de Z". */
    rangeStart(): number {
        return this.store.total() === 0 ? 0 : (this.store.currentPage() - 1) * this.store.pageSize() + 1;
    }

    /** Índice (1-based) do último item exibido na página atual, para o texto "Exibindo X–Y de Z". */
    rangeEnd(): number {
        return Math.min(this.store.currentPage() * this.store.pageSize(), this.store.total());
    }

    /**
     * Janela de números de página pro rodapé: sempre mostra a primeira, a última e as vizinhas da
     * atual, com "…" nos saltos — pra não listar 1 botão por página quando há muitas (ex.: 50 páginas).
     */
    pageNumbers(): (number | '…')[] {
        const total = this.store.totalPages();
        const current = this.store.currentPage();

        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        const kept = new Set([1, total, current - 1, current, current + 1]);
        const sorted = Array.from(kept).filter(page => page >= 1 && page <= total).sort((a, b) => a - b);

        const result: (number | '…')[] = [];
        let previous = 0;
        for (const page of sorted) {
            if (previous && page - previous > 1) {
                result.push('…');
            }
            result.push(page);
            previous = page;
        }
        return result;
    }
}
