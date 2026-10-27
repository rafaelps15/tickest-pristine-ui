import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, effect, HostListener, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsersStore } from '../application/users.store';
import { UserSummary, UserRoleSummary } from '../entities/user-summary';
import { UserFilters, UserStatus } from '../entities/user-filters';
import { RolesStore } from '../../roles';
import {
    SessionService, ConfirmDialogService, ToastService,
    visibleRoles as sharedVisibleRoles, hiddenRolesCount as sharedHiddenRolesCount, hiddenRolesNames as sharedHiddenRolesNames,
    getRoleColor, injectSidePanelOverlay, isEscapeFromNestedLayer
} from '../../shared';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { UserListInfoPanelComponent } from './user-list-info-panel.component';
import { UserListGuideComponent } from './user-list-guide.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar/filter-bar.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';
import { UserListInsightsComponent } from './user-list-insights.component';

const DEFAULT_STATUS: UserStatus = 'All';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS: UserStatus[] = ['All', 'Active', 'Inactive'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Quanto tempo a linha de quem acabou de ser criado fica destacada na tabela. */
const NEW_USER_HIGHLIGHT_MS = 4000;

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


/** Tela administrativa de gestão de usuários: listagem paginada/filtrada, criação, edição, roles e ativação/desativação. */
@Component({
    selector: 'app-user-list',
    imports: [ReactiveFormsModule, DatePipe, PageHeaderComponent, RowActionsComponent, UserListInfoPanelComponent, UserListGuideComponent, PaginationComponent, FilterBarComponent, EmptyStateComponent, LoadingStateComponent, DialogComponent, UserListInsightsComponent],
    templateUrl: './user-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    /** Diálogo aberto agora (renderizado com `@if`, via `<app-dialog>`), ou `null`. */
    protected readonly openDialog = signal<'create' | 'edit' | 'roles' | null>(null);

    /** Fecha o diálogo aberto (X, Esc, clique fora, "Cancelar" ou depois de salvar). */
    closeDialog(): void {
        this.openDialog.set(null);
    }

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
        email: ['', [Validators.required, Validators.email]]
    });

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

    /** Mensagem de período de cadastro inválido (data inicial depois da final); `null` quando o período é coerente. */
    periodError = signal<string | null>(null);

    /** Texto digitado na busca, antes do debounce — ver o effect de busca no construtor. */
    searchInput = signal('');

    /** Funções marcadas no modal de criação (por nome) — as padrão (`isDefault`) já vêm marcadas ao abrir. */
    createRoleNames = signal<Set<string>>(new Set());

    /** Se o último envio do modal de criação foi "Criar e cadastrar outro" (mantém o modal aberto) em vez de "Criar". */
    private createAnother = false;

    /** Anúncio do modal de criação ao cadastrar e manter aberto ("Ana Costa criada.") — região `aria-live` dentro do modal. */
    readonly createAnnouncement = signal('');

    /** Usuário recém-criado, destacado por alguns segundos na tabela pra quem acabou de cadastrar encontrar a linha. */
    readonly highlightedUserId = signal<string | null>(null);

    /** Texto da região `aria-live` permanente do lote — vazia sem seleção; a região já existe antes, pra primeira marcação ser anunciada. */
    readonly selectionAnnouncement = computed(() => {
        const count = this.selectedUserIds().size;
        if (count === 0) return '';
        return count === 1 ? '1 usuário selecionado' : `${count} usuários selecionados`;
    });

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

    readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

    /** Se a janela está abaixo de "lg", onde o painel "Informações do Usuário" vira um diálogo modal de tela cheia. */
    readonly isOverlayViewport = injectSidePanelOverlay();

    /** Verifica se um campo do formulário de criação está inválido e já foi tocado. */
    isCreateFieldInvalid(fieldName: keyof typeof this.createForm.controls): boolean {
        const control = this.createForm.controls[fieldName];
        return control.invalid && (control.dirty || control.touched);
    }

    /** Verifica se um campo do formulário de edição está inválido e já foi tocado. */
    isEditFieldInvalid(fieldName: keyof typeof this.editForm.controls): boolean {
        const control = this.editForm.controls[fieldName];
        return control.invalid && (control.dirty || control.touched);
    }

    constructor() {
        effect(() => {
            if (this.store.success()) {
                untracked(() => this.onUserCreated());
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

    /**
     * Esc fecha o painel "Informações do Usuário", de qualquer lugar da tela — essencial no overlay
     * de tela cheia, sem botão "fora" pra clicar. Exceto quando o Esc nasce dentro de um modal
     * (edição, funções, confirmação) ou de um menu "⋮": ali ele só fecha aquela camada, sem levar
     * o painel junto.
     */
    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: Event): void {
        if (isEscapeFromNestedLayer(event)) return;

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

    /** Prepara o modal de criação: limpa o estado anterior e pré-marca as funções padrão (`isDefault`). */
    openCreateModal(): void {
        this.openDialog.set('create');
        this.store.resetState();
        this.createAnnouncement.set('');
        this.createRoleNames.set(new Set(this.rolesStore.roles().filter(role => role.isDefault).map(role => role.name)));
    }

    /** Indica se a função está marcada no modal de criação. */
    isCreateRoleChecked(roleName: string): boolean {
        return this.createRoleNames().has(roleName);
    }

    /** Marca ou desmarca uma função no modal de criação. */
    toggleCreateRole(roleName: string, checked: boolean): void {
        this.createRoleNames.update(current => {
            const next = new Set(current);
            if (checked) next.add(roleName); else next.delete(roleName);
            return next;
        });
    }

    /** Valida e envia o cadastro; `another` mantém o modal aberto pra cadastrar o próximo ("Criar e cadastrar outro"). */
    onCreateSubmit(another = false): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        this.createAnother = another;
        const raw = this.createForm.getRawValue();
        this.store.createUser({
            firstName: raw.firstName!,
            lastName: raw.lastName!,
            email: raw.email!
        }, Array.from(this.createRoleNames()));
    }

    /**
     * Fecha o ciclo de um cadastro bem-sucedido: avisa (toast, ou alerta de sucesso parcial quando
     * só as funções falharam), destaca a linha nova e, em "Criar e cadastrar outro", limpa o
     * formulário mantendo as funções escolhidas — o próximo contratado costuma ter as mesmas — e
     * devolve o foco ao Nome.
     */
    private onUserCreated(): void {
        const { firstName, lastName, email } = this.createForm.getRawValue();
        const name = `${firstName} ${lastName}`;

        if (this.store.createRolesFailed()) {
            this.toastService.show(`Convite enviado para ${email}, mas sem as funções escolhidas. Use "Atribuir funções" no menu ⋮ da linha.`, 'info');
        } else {
            this.toastService.show(`Convite enviado para ${email}.`);
        }

        this.highlightCreatedUser(this.store.createdUserId());
        this.createForm.reset({ firstName: '', lastName: '', email: '' });

        if (this.createAnother) {
            this.createAnnouncement.set(`Convite enviado para ${name}. Pronto para o próximo.`);
            document.getElementById('userCreateFirstName')?.focus();
        } else {
            this.closeDialog();
        }
    }

    /** Destaca a linha do usuário recém-criado por {@link NEW_USER_HIGHLIGHT_MS} — só aparece se ele estiver na página/filtro atual. */
    private highlightCreatedUser(userId: string | null): void {
        if (!userId) return;

        this.highlightedUserId.set(userId);
        setTimeout(() => {
            if (this.highlightedUserId() === userId) this.highlightedUserId.set(null);
        }, NEW_USER_HIGHLIGHT_MS);
    }

    /** Abre o modal de edição de cadastro pré-preenchendo nome/sobrenome do usuário selecionado. */
    openEditModal(user: UserSummary): void {
        this.openDialog.set('edit');
        this.store.clearDialogErrors();
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
            this.closeDialog();
            this.toastService.show(`Cadastro de "${trimmedFirstName} ${trimmedLastName}" atualizado.`);
        });
    }

    /** Abre o modal de atribuição de roles pré-marcando as roles já atribuídas ao usuário selecionado. */
    openAssignRolesModal(user: UserSummary): void {
        this.openDialog.set('roles');
        this.store.clearDialogErrors();
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

    /** Nomes das funções de administrador do sistema (`isAdministrator`), pra proteger a própria conta de perder o acesso. */
    private readonly adminRoleNames = computed(() =>
        new Set(this.rolesStore.roles().filter(role => role.isAdministrator).map(role => role.name)));

    /** O que o "Salvar" do modal de funções vai mudar em relação ao que o usuário tem hoje — mostrado ao vivo, em vez de um aviso genérico de "substitui tudo". */
    readonly rolesDiff = computed(() => {
        const user = this.selectedUser();
        if (!user) return { added: [] as string[], removed: [] as string[] };

        const current = new Set(user.roles.map(role => role.name));
        const selected = this.selectedRoleNames();
        const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
        return {
            added: [...selected].filter(name => !current.has(name)).sort(byName),
            removed: [...current].filter(name => !selected.has(name)).sort(byName)
        };
    });

    /**
     * Se a seleção tiraria da própria conta logada todas as funções de administrador — o mesmo
     * risco que já bloqueia a auto-desativação: o admin perderia o acesso a esta tela sem como
     * desfazer pela interface. Achado do critique de 2026-10-27.
     */
    readonly removesOwnAdminAccess = computed(() => {
        const user = this.selectedUser();
        if (!user || !this.isCurrentUser(user)) return false;

        const adminNames = this.adminRoleNames();
        const hadAdmin = user.roles.some(role => adminNames.has(role.name));
        const keepsAdmin = [...this.selectedRoleNames()].some(name => adminNames.has(name));
        return hadAdmin && !keepsAdmin;
    });

    /** Se a seleção deixaria o usuário sem nenhuma função — permitido, mas avisado: ele entra e não consegue fazer nada. */
    readonly leavesWithoutRoles = computed(() => this.selectedUser() !== null && this.selectedRoleNames().size === 0);

    /** Indica se a função é de administrador do sistema, pra marcar no modal de atribuição. */
    isAdminRole(roleName: string): boolean {
        return this.adminRoleNames().has(roleName);
    }

    onAssignRolesSubmit(): void {
        const user = this.selectedUser();
        if (!user || this.removesOwnAdminAccess()) return;

        this.store.assignRoles(user.id, Array.from(this.selectedRoleNames()), () => {
            this.closeDialog();
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

    /** Cor escolhida pra uma função — prévia só neste navegador (ver `shared/utils/role-colors.util.ts`); `null` cai no acento padrão. */
    roleColor(roleName: string): string | null {
        return getRoleColor(roleName);
    }

    /** Impede desativar/reativar a própria conta logada, que travaria a sessão atual sem recuperação pela UI. */
    isCurrentUser(user: UserSummary): boolean {
        return user.id === this.sessionService.userId();
    }

    /**
     * Confirma e desativa o usuário selecionado, bloqueando o acesso. O toast de sucesso oferece
     * "Desfazer" (reativa na hora) — desativar é reversível, e o atalho poupa achar a linha de novo.
     * Textos sem gênero gramatical: o nome da pessoa não diz o gênero.
     */
    onDeactivate(user: UserSummary): void {
        const name = `${user.firstName} ${user.lastName}`;
        this.confirmDialogService.confirm({
            title: `Desativar "${name}"?`,
            message: `O acesso de ${name} ao Tickest é bloqueado na hora. Dá pra reativar depois.`,
            confirmLabel: 'Desativar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.store.deactivate(user.id, () => {
                    this.toastService.show(`Acesso de "${name}" desativado.`, 'success', {
                        label: 'Desfazer',
                        run: () => this.store.activate(user.id, () => this.toastService.show(`Acesso de "${name}" reativado.`))
                    });
                });
            }
        });
    }

    /** Confirma e reativa o usuário selecionado, liberando o acesso de novo. */
    onActivate(user: UserSummary): void {
        const name = `${user.firstName} ${user.lastName}`;
        this.confirmDialogService.confirm({
            title: `Reativar "${name}"?`,
            message: `${name} volta a conseguir entrar no Tickest.`,
            confirmLabel: 'Reativar',
            variant: 'success'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.store.activate(user.id, () => {
                    // Reativar quem nunca ativou a conta não traz o convite de volta (spec 008, REQ-10): oferece o reenvio na hora.
                    if (user.pendingActivation) {
                        this.toastService.show(`Acesso de "${name}" reativado. Falta reenviar o convite para a conta ser ativada.`, 'info', {
                            label: 'Reenviar convite',
                            run: () => this.onResendInvitation(user)
                        });
                    } else {
                        this.toastService.show(`Acesso de "${name}" reativado.`);
                    }
                });
            }
        });
    }

    /** Indica se dá pra reenviar o convite: conta ainda não ativada e usuário ativo (o back-end recusa desativado). */
    canResendInvitation(user: UserSummary): boolean {
        return user.pendingActivation && user.isActive;
    }

    /** Reenvia o convite de ativação; o anterior deixa de valer. */
    onResendInvitation(user: UserSummary): void {
        this.store.resendInvitation(user.id, () => {
            this.toastService.show(`Novo convite enviado para ${user.email}. O anterior deixou de valer.`);
        });
    }

    /** Atalho do painel: reenvia o convite do usuário selecionado no painel. */
    onPanelResendInvitation(): void {
        const user = this.infoPanelUser();
        if (user) this.onResendInvitation(user);
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
            ? `${names.join(', ')}. O acesso dessas pessoas ao Tickest é bloqueado na hora.`
            : 'O acesso dessas pessoas ao Tickest é bloqueado na hora.';

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
                } else {
                    // Antes, um lote que falhava inteiro não dizia nada aqui — só o alerta acima da lista.
                    this.toastService.show('Nenhum usuário foi desativado. O motivo está acima da lista.', 'danger');
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
        this.applyPeriod(value || undefined, this.store.filters().createdTo);
    }

    /** Muda a data final do período de cadastro. */
    onCreatedToChange(value: string): void {
        this.applyPeriod(this.store.filters().createdFrom, value || undefined);
    }

    /**
     * Aplica o período só se for coerente ("de" até "até"); invertido, mantém o último período
     * válido e explica o problema abaixo dos campos — antes a tela só mostrava "Nenhum usuário
     * encontrado", sem dizer por quê.
     */
    private applyPeriod(createdFrom: string | undefined, createdTo: string | undefined): void {
        if (createdFrom && createdTo && createdFrom > createdTo) {
            this.periodError.set('A data inicial precisa ser igual ou anterior à data final.');
            return;
        }

        this.periodError.set(null);
        this.store.setPeriod(createdFrom, createdTo);
    }

    /** Muda a quantidade de itens exibidos por página. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Limpa todos os filtros, incluindo o campo de busca local. */
    onClearFilters(): void {
        this.searchInput.set('');
        this.periodError.set(null);
        this.store.clearFilters();
    }

}
