import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, effect, HostListener } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsersStore } from '../application/users.store';
import { UserSummary, UserRoleSummary } from '../entities/user-summary';
import { UserFilters, UserStatus } from '../entities/user-filters';
import { RolesStore } from '../../roles';
import {
    SessionService, ConfirmDialogService, ToastService,
    visibleRoles as sharedVisibleRoles, hiddenRolesCount as sharedHiddenRolesCount, hiddenRolesNames as sharedHiddenRolesNames
} from '../../shared';
import { DropdownFixedPositionDirective } from '../../shared/ui/directives/dropdown-fixed-position.directive';
import { UserListInfoPanelComponent } from './user-list-info-panel.component';
import { UserListInsightsComponent } from './user-list-insights.component';
import { UserListGuideComponent } from './user-list-guide.component';

const DEFAULT_STATUS: UserStatus = 'All';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS: UserStatus[] = ['All', 'Active', 'Inactive'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Lê o status da query string só se bater com um dos valores aceitos; senão, o padrão ("Todos"). */
function parseStatusParam(value: string | null): UserStatus {
    return value !== null && (STATUS_OPTIONS as string[]).includes(value) ? (value as UserStatus) : DEFAULT_STATUS;
}

/** Lê uma data (aaaa-mm-dd) da query string só se o formato bater; senão, `undefined`. */
function parseDateParam(value: string | null): string | undefined {
    return value !== null && DATE_PATTERN.test(value) ? value : undefined;
}

/** Lê um inteiro positivo (página) da query string; se ausente ou inválido, devolve 1. */
function parsePageParam(value: string | null): number {
    if (value === null) return DEFAULT_PAGE;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
}

/** Lê o tamanho de página da query string só se bater com uma das opções aceitas; senão, o padrão. */
function parsePageSizeParam(value: string | null): number {
    if (value === null) return DEFAULT_PAGE_SIZE;
    const parsed = Number(value);
    return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

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
    imports: [ReactiveFormsModule, DatePipe, DropdownFixedPositionDirective, UserListInfoPanelComponent, UserListInsightsComponent, UserListGuideComponent],
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
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

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

    /** Ids dos usuários marcados para ação em lote, na página atual. */
    selectedUserIds = signal<Set<string>>(new Set());

    /**
     * Usuário selecionado por clique na linha, pro painel "Informações do Usuário" — estado de UI
     * puro (não é parâmetro de busca da API, não entra em `UserFilters`), independente da seleção
     * em lote acima (semânticas diferentes: uma linha pode estar selecionada pro painel sem estar
     * marcada pra ação em lote, e vice-versa). Só sincronizado com a URL (query param `userId`)
     * pra sobreviver a recarregar/compartilhar o link.
     */
    infoPanelUserId = signal<string | undefined>(undefined);

    /** Usuário selecionado, com os dados já carregados na tabela — `undefined` se o id não estiver (mais) na página/filtro atual. */
    infoPanelUser = computed(() => this.store.users().find(user => user.id === this.infoPanelUserId()));

    readonly pageSizeOptions = [10, 20, 50, 100];

    constructor() {
        effect(() => {
            if (this.store.success()) {
                const { firstName, lastName } = this.createForm.getRawValue();
                this.createForm.reset({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
                document.getElementById('userCreateModalCloseButton')?.click();
                this.toastService.show(`"${firstName} ${lastName}" criado com sucesso.`);
            }
        });

        // Espera ~300ms após a última tecla antes de disparar a busca, pra não buscar a cada letra digitada.
        toObservable(this.searchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.setSearch(search));

        // Qualquer troca de página, tamanho de página ou filtro invalida a seleção em lote da página anterior.
        effect(() => {
            this.store.filters();
            this.selectedUserIds.set(new Set());
        });

        // Toda mudança de filtro/página se reflete na URL, sem empilhar histórico a cada
        // alternância — "Voltar" deve levar pra fora da tela, não filtro por filtro. Só navega
        // quando o alvo realmente difere da URL atual — evita regravar (e reagir de novo) o mesmo
        // estado que acabou de ser lido dela, ao inicializar. O termo de busca livre fica de fora
        // de propósito: texto livre/dado pessoal não vai na query string (mesma regra já aplicada
        // em Monitorar Tickets).
        effect(() => {
            const queryParams = { ...this.filtersToQueryParams(this.store.filters()), userId: this.infoPanelUserId() ?? null };
            if (this.matchesCurrentUrl(queryParams)) return;

            this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
        });

        // Página alvo além do total (ex.: vinda de uma URL salva de quando havia mais resultados)
        // volta pra última página válida, em vez de mostrar uma tabela vazia.
        effect(() => {
            const totalPages = this.store.totalPages();
            const currentPage = this.store.filters().page;
            if (totalPages > 0 && currentPage > totalPages) {
                this.store.goToPage(totalPages);
            }
        });
    }

    /**
     * Restaura status, período, página e tamanho de página a partir da query string ao
     * inicializar — recarregar, voltar ou compartilhar o link reproduz o mesmo estado. Parâmetro
     * ausente ou inválido (fora do enum, formato de data errado etc.) volta ao padrão, nunca
     * quebra a tela.
     */
    ngOnInit(): void {
        const params = this.route.snapshot.queryParamMap;

        const filters: UserFilters = {
            status: parseStatusParam(params.get('status')),
            createdFrom: parseDateParam(params.get('createdFrom')),
            createdTo: parseDateParam(params.get('createdTo')),
            page: parsePageParam(params.get('page')),
            pageSize: parsePageSizeParam(params.get('pageSize'))
        };

        this.store.hydrateFiltersFromUrl(filters);
        this.infoPanelUserId.set(params.get('userId') || undefined);
        this.store.resetState();
        this.store.loadAll();
        this.rolesStore.load();
    }

    /**
     * Elemento com foco no momento em que o painel "Informações do Usuário" foi aberto — pra
     * devolver o foco a ele ao fechar, em vez de deixá-lo "perdido" no topo da página. Importa
     * principalmente no overlay de tela cheia (abaixo de "lg"), onde o elemento que abriu o painel
     * fica fora da área visível enquanto ele está aberto. Mesmo padrão de Monitorar Tickets.
     */
    private lastFocusedElement: HTMLElement | null = null;

    /** Seleciona o usuário clicado/ativado pro painel; clicar de novo no já selecionado desseleciona. */
    selectRow(userId: string): void {
        if (this.infoPanelUserId() === userId) {
            this.closeInfoPanel();
            return;
        }

        this.lastFocusedElement = document.activeElement as HTMLElement;
        this.infoPanelUserId.set(userId);
    }

    /** Fecha o painel "Informações do Usuário" (clique no X, no backdrop, ou tecla Esc) e devolve o foco a quem o abriu. */
    closeInfoPanel(): void {
        this.infoPanelUserId.set(undefined);
        this.lastFocusedElement?.focus();
        this.lastFocusedElement = null;
    }

    /** Esc fecha o painel "Informações do Usuário", de qualquer lugar da tela — essencial no overlay de tela cheia, sem botão "fora" pra clicar. */
    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.infoPanelUserId()) {
            this.closeInfoPanel();
        }
    }

    /** Atalho do painel: abre o modal de edição de cadastro pro usuário selecionado no painel. */
    onPanelEdit(): void {
        const user = this.infoPanelUser();
        if (user) this.openEditModal(user);
    }

    /** Atalho do painel: abre o modal de atribuição de funções pro usuário selecionado no painel. */
    onPanelAssignRoles(): void {
        const user = this.infoPanelUser();
        if (user) this.openAssignRolesModal(user);
    }

    /** Atalho do painel: ativa ou desativa (conforme o estado atual) o usuário selecionado no painel, com a mesma confirmação já usada na linha. */
    onPanelToggleActive(): void {
        const user = this.infoPanelUser();
        if (!user) return;

        if (user.isActive) this.onDeactivate(user); else this.onActivate(user);
    }

    /** Converte os filtros atuais no formato aceito por `Router.navigate`, omitindo valores padrão pra manter a URL curta. */
    private filtersToQueryParams(filters: UserFilters): Record<string, string | number | null> {
        return {
            status: filters.status === DEFAULT_STATUS ? null : filters.status,
            createdFrom: filters.createdFrom ?? null,
            createdTo: filters.createdTo ?? null,
            page: filters.page === DEFAULT_PAGE ? null : filters.page,
            pageSize: filters.pageSize === DEFAULT_PAGE_SIZE ? null : filters.pageSize
        };
    }

    /** Compara o alvo com a query string atual, pra só navegar quando algo de fato mudou. */
    private matchesCurrentUrl(target: Record<string, string | number | null>): boolean {
        const current = this.route.snapshot.queryParamMap;
        return Object.entries(target).every(([key, value]) =>
            current.get(key) === (value === null ? null : String(value)));
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
        const trimmedFirstName = firstName!.trim();
        const trimmedLastName = lastName!.trim();
        this.store.updateProfile(user.id, { firstName: trimmedFirstName, lastName: trimmedLastName }, () => {
            document.getElementById('userEditModalCloseButton')?.click();
            this.toastService.show(`Cadastro de "${trimmedFirstName} ${trimmedLastName}" atualizado.`);
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

    /** Até 2 funções exibidas como badge; o restante vira um badge "+N" (regra compartilhada, ver `shared/utils/role-badges.util`). */
    visibleRoles(user: UserSummary): UserRoleSummary[] {
        return sharedVisibleRoles(user.roles);
    }

    /** Quantidade de funções além das já exibidas como badge. */
    hiddenRolesCount(user: UserSummary): number {
        return sharedHiddenRolesCount(user.roles);
    }

    /** Nomes das funções ocultas no badge "+N", para exibir no `title` (tooltip nativo). */
    hiddenRolesNames(user: UserSummary): string {
        return sharedHiddenRolesNames(user.roles);
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

    /** Indica se o usuário pode ser marcado para ação em lote: ativo e diferente da própria conta logada. */
    canSelectForBulk(user: UserSummary): boolean {
        return user.isActive && !this.isCurrentUser(user);
    }

    /** Indica se o usuário está marcado na seleção em lote. */
    isSelected(userId: string): boolean {
        return this.selectedUserIds().has(userId);
    }

    /** Marca ou desmarca um usuário na seleção em lote. */
    toggleSelection(userId: string, checked: boolean): void {
        this.selectedUserIds.update(current => {
            const next = new Set(current);
            if (checked) next.add(userId); else next.delete(userId);
            return next;
        });
    }

    /** Quantidade de usuários selecionados. */
    selectedCount(): number {
        return this.selectedUserIds().size;
    }

    /** Indica se todos os usuários elegíveis da página estão selecionados — estado do checkbox "selecionar todos". */
    allEligibleSelected(): boolean {
        const eligible = this.eligibleUsersForBulk();
        return eligible.length > 0 && eligible.every(user => this.selectedUserIds().has(user.id));
    }

    /** Indica se o checkbox "selecionar todos" deve ficar indeterminado (alguns, não todos, marcados). */
    someEligibleSelected(): boolean {
        const eligible = this.eligibleUsersForBulk();
        return eligible.some(user => this.selectedUserIds().has(user.id)) && !this.allEligibleSelected();
    }

    /** Marca ou desmarca de uma vez todos os usuários elegíveis da página atual. */
    toggleSelectAll(checked: boolean): void {
        this.selectedUserIds.set(checked ? new Set(this.eligibleUsersForBulk().map(user => user.id)) : new Set());
    }

    /** Limpa a seleção em lote. */
    clearSelection(): void {
        this.selectedUserIds.set(new Set());
    }

    /** Confirma e desativa em lote todos os usuários selecionados. */
    onBulkDeactivate(): void {
        const userIds = Array.from(this.selectedUserIds());
        if (userIds.length === 0) return;

        const names = this.store.users()
            .filter(user => this.selectedUserIds().has(user.id))
            .map(user => `${user.firstName} ${user.lastName}`);
        const label = userIds.length === 1 ? '1 usuário selecionado' : `${userIds.length} usuários selecionados`;
        const message = names.length <= 8
            ? `${names.join(', ')}. O login deles será bloqueado imediatamente.`
            : 'O login deles será bloqueado imediatamente.';

        this.confirmDialogService.confirm({
            title: `Desativar ${label}?`,
            message,
            confirmLabel: 'Desativar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) return;

            this.store.deactivateMany(userIds, (succeededCount, failedCount) => {
                this.clearSelection();
                if (failedCount === 0) {
                    this.toastService.show(succeededCount === 1 ? '1 usuário desativado.' : `${succeededCount} usuários desativados.`);
                } else if (succeededCount > 0) {
                    this.toastService.show(`${succeededCount} de ${succeededCount + failedCount} usuários desativados.`, 'info');
                }
            });
        });
    }

    /** Usuários elegíveis para seleção em lote na página atual. */
    private eligibleUsersForBulk(): UserSummary[] {
        return this.store.users().filter(user => this.canSelectForBulk(user));
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
