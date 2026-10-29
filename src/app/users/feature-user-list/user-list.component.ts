import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, effect, HostListener, untracked, afterNextRender, Injector, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { UsersStore } from '../application/users.store';
import { UserSummary, UserRoleSummary } from '../entities/user-summary';
import { USER_NAME_MAX_LENGTH } from '../entities/user-profile';
import { UserFilters, UserStatus } from '../entities/user-filters';
import { RolesStore } from '../../roles';
import {
    SessionService, ConfirmDialogService, ToastService,
    visibleRoles as sharedVisibleRoles, hiddenRolesCount as sharedHiddenRolesCount, hiddenRolesNames as sharedHiddenRolesNames,
    injectSidePanelOverlay, isEscapeFromNestedLayer
} from '../../shared';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { UserListInfoPanelComponent } from './user-list-info-panel.component';
import { UserListGuideComponent } from './user-list-guide.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';
import { UserListInsightsComponent } from './user-list-insights.component';
import { UserStatusBadgeComponent, UserStatusKind, userStatusKind } from './user-status-badge.component';

/** Status padrão da listagem ("Todos"). */
const DEFAULT_STATUS: UserStatus = 'All';
/** Página padrão da listagem. */
const DEFAULT_PAGE = 1;
/** Tamanho de página padrão da listagem. */
const DEFAULT_PAGE_SIZE = 20;
/** Tamanhos de página que o seletor "Por página" oferece (e que a URL aceita). */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
/** Status aceitos na query string. */
const STATUS_OPTIONS: UserStatus[] = ['All', 'Active', 'Inactive'];
/** Formato de data aceito na query string (aaaa-mm-dd). */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Quanto tempo a linha de quem acabou de ser criado fica destacada na tabela. */
const NEW_USER_HIGHLIGHT_MS = 4000;
/** Quantos nomes a confirmação da desativação em lote lista antes de resumir em "e mais N". */
const BULK_NAMES_SHOWN = 8;

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

/** Cópia do conjunto com o item adicionado (`checked`) ou removido — as três seleções da tela (funções no cadastro, funções no modal, lote). */
function toggleInSet(current: Set<string>, item: string, checked: boolean): Set<string> {
    const next = new Set(current);
    if (checked) next.add(item); else next.delete(item);
    return next;
}

/** "Ana, Bruno e Carla" — lista de nomes em português, com "e mais N" acima de {@link BULK_NAMES_SHOWN}. */
function joinNames(names: string[]): string {
    if (names.length > BULK_NAMES_SHOWN) {
        return `${names.slice(0, BULK_NAMES_SHOWN).join(', ')} e mais ${names.length - BULK_NAMES_SHOWN}`;
    }
    return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** Tela administrativa de gestão de usuários: listagem paginada/filtrada, criação, edição, roles e ativação/desativação. */
@Component({
    selector: 'app-user-list',
    imports: [ReactiveFormsModule, DatePipe, PageHeaderComponent, RowActionsComponent, UserListInfoPanelComponent, UserListGuideComponent, PaginationComponent, EmptyStateComponent, LoadingStateComponent, DialogComponent, UserListInsightsComponent, UserStatusBadgeComponent],
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

    /** Construtor dos formulários reativos. */
    private readonly fb = inject(FormBuilder);
    /** Estado da listagem e das ações sobre usuários. */
    protected readonly store = inject(UsersStore);
    /** Funções cadastradas, pros modais de cadastro e de atribuição. */
    protected readonly rolesStore = inject(RolesStore);
    /** Sessão de quem está logado — pra proteger a própria conta. */
    private readonly sessionService = inject(SessionService);
    /** Modal de confirmação global (desativar, reativar). */
    private readonly confirmDialogService = inject(ConfirmDialogService);
    /** Toasts de confirmação, com "Desfazer"/"Reenviar convite". */
    private readonly toastService = inject(ToastService);
    /** Rota atual, pra ler e gravar os filtros na query string. */
    private readonly route = inject(ActivatedRoute);
    /** Roteador, pra refletir os filtros na URL. */
    private readonly router = inject(Router);
    /** Injector pro `afterNextRender` que devolve o foco depois que a tela redesenha. */
    private readonly injector = inject(Injector);

    /** Formulário de cadastro (nome, sobrenome, e-mail) do modal "Novo Usuário". */
    createForm = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(USER_NAME_MAX_LENGTH)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(USER_NAME_MAX_LENGTH)]],
        email: ['', [Validators.required, Validators.email]]
    });

    /** Formulário de edição de nome/sobrenome do usuário selecionado. */
    editForm = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(USER_NAME_MAX_LENGTH)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(USER_NAME_MAX_LENGTH)]]
    });

    /** Usuário selecionado para atribuição de roles. */
    selectedUser = signal<UserSummary | null>(null);

    /** Usuário selecionado para edição de cadastro (nome/sobrenome). */
    selectedUserForEdit = signal<UserSummary | null>(null);

    /** Roles marcadas no modal de atribuição (por nome). */
    selectedRoleNames = signal<Set<string>>(new Set());

    /** Mensagem de período de cadastro inválido (data inicial depois da final); `null` quando o período é coerente. */
    periodError = signal<string | null>(null);

    /** Se quem usa abriu os campos de período (recolhidos por padrão: filtro de uso raro); com um período aplicado, eles aparecem de qualquer jeito. */
    readonly periodOpen = signal(false);

    /** Texto digitado na busca, antes do debounce — ver a busca no construtor. */
    searchInput = signal('');

    /** Funções marcadas no modal de criação (por nome) — as padrão (`isDefault`) já vêm marcadas ao abrir. */
    createRoleNames = signal<Set<string>>(new Set());

    /** Se o último envio do modal de criação foi "Convidar e cadastrar outro" (mantém o modal aberto) em vez de "Enviar convite". */
    private createAnother = false;

    /** Anúncio do modal de criação ao cadastrar e manter aberto ("Convite enviado para Ana Costa. Pronto para o próximo.") — região `aria-live` dentro do modal. */
    readonly createAnnouncement = signal('');

    /** Usuário recém-criado, destacado por alguns segundos na tabela pra quem acabou de cadastrar encontrar a linha. */
    readonly highlightedUserId = signal<string | null>(null);

    /** Timer que tira o destaque da linha nova — limpo se a tela for destruída antes. */
    private highlightTimer: ReturnType<typeof setTimeout> | null = null;

    /** Ids dos usuários marcados para ação em lote, na página atual. */
    selectedUserIds = signal<Set<string>>(new Set());

    /** Texto da região `aria-live` permanente do lote — vazia sem seleção; a região já existe antes, pra primeira marcação ser anunciada. */
    readonly selectionAnnouncement = computed(() => {
        const count = this.selectedUserIds().size;
        if (count === 0) return '';
        return count === 1 ? '1 usuário selecionado' : `${count} usuários selecionados`;
    });

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

    /** Tamanhos de página oferecidos no rodapé da tabela. */
    readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

    /** Se a janela está abaixo de "lg", onde o painel "Informações do Usuário" vira um diálogo modal de tela cheia. */
    readonly isOverlayViewport = injectSidePanelOverlay();

    /** Se há um período de cadastro aplicado. */
    readonly hasPeriod = computed(() => !!this.store.filters().createdFrom || !!this.store.filters().createdTo);

    /** Se há algum filtro aplicado (busca, status ou período) — decide entre "Limpar filtros" e o vazio de primeiro uso. */
    readonly hasFilters = computed(() =>
        !!this.store.filters().search || this.store.filters().status !== DEFAULT_STATUS || this.hasPeriod());

    /**
     * Recarga com a lista já na tela (troca de filtro/página): as linhas atuais continuam legíveis
     * (sem esmaecer — DESIGN.md proíbe `opacity` em texto que precisa ser lido) e só a barra diz
     * "Atualizando…".
     */
    readonly isRefreshing = computed(() => this.store.listState().loading && this.store.users().length > 0);

    /** Usuários elegíveis para seleção em lote na página atual: ativos e diferentes da própria conta. */
    readonly eligibleUsersForBulk = computed(() => this.store.users().filter(user => this.canSelectForBulk(user)));

    /** Se todos os usuários elegíveis da página estão selecionados — estado do checkbox "selecionar todos". */
    readonly allEligibleSelected = computed(() => {
        const eligible = this.eligibleUsersForBulk();
        return eligible.length > 0 && eligible.every(user => this.selectedUserIds().has(user.id));
    });

    /** Se o checkbox "selecionar todos" fica indeterminado (alguns, não todos, marcados). */
    readonly someEligibleSelected = computed(() =>
        !this.allEligibleSelected() && this.eligibleUsersForBulk().some(user => this.selectedUserIds().has(user.id)));

    /** Se a desativação em lote (ou a contagem de chamados que vem antes dela) está em andamento. */
    readonly bulkBusy = computed(() => {
        const counting = this.store.countingTicketsIds();
        return this.store.deactivatingIds().length > 0 || [...this.selectedUserIds()].some(id => counting.includes(id));
    });

    /** Verifica se um campo de um dos formulários está inválido e já foi tocado. */
    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && control.invalid && (control.dirty || control.touched);
    }

    /** Limite de nome e sobrenome nos campos, o mesmo do back-end. */
    protected readonly nameMaxLength = USER_NAME_MAX_LENGTH;

    /** Mensagem de erro de nome/sobrenome ("O nome é obrigatório."), a mesma no cadastro e na edição. */
    nameError(control: AbstractControl, subject: string): string {
        if (control.errors?.['required']) return `${subject} é obrigatório.`;
        if (control.errors?.['minlength']) return `${subject} deve ter no mínimo 2 caracteres.`;
        return `${subject} deve ter no máximo ${USER_NAME_MAX_LENGTH} caracteres.`;
    }

    /** Liga os efeitos da tela: fim do cadastro, busca com debounce, URL, seleção, página fora do total e painel órfão. */
    constructor() {
        effect(() => {
            if (this.store.success()) {
                untracked(() => this.onUserCreated());
            }
        });

        // Espera ~300ms após a última tecla antes de buscar. O `skip(1)` ignora o valor inicial (''),
        // que voltava `?page=3` do link pra página 1 e disparava um GET a mais ao abrir a tela.
        toObservable(this.searchInput).pipe(
            skip(1),
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
        // em Monitorar Chamados).
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

        // Painel de alguém que saiu da lista (desativado com o filtro "Ativos", outra página…): fecha
        // de verdade — tira o `userId` da URL e devolve o foco, em vez de sumir sem aviso.
        effect(() => {
            const userId = this.infoPanelUserId();
            if (!userId || this.store.listState().loading || !this.store.usersPage()) return;
            if (!this.infoPanelUser()) untracked(() => this.closeInfoPanel());
        });

        inject(DestroyRef).onDestroy(() => {
            if (this.highlightTimer) clearTimeout(this.highlightTimer);
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
     * fica fora da área visível enquanto ele está aberto. Mesmo padrão de Monitorar Chamados.
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
        if (this.lastFocusedElement?.isConnected) this.lastFocusedElement.focus();
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

    /** Marca ou desmarca uma função no modal de criação. */
    toggleCreateRole(roleName: string, checked: boolean): void {
        this.createRoleNames.update(current => toggleInSet(current, roleName, checked));
    }

    /** Valida e envia o cadastro; `another` mantém o modal aberto pra cadastrar o próximo ("Convidar e cadastrar outro"). */
    onCreateSubmit(another = false): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            this.focusFirstInvalid('#userCreateModal');
            return;
        }

        this.createAnother = another;
        const raw = this.createForm.getRawValue();
        this.store.createUser({
            firstName: raw.firstName!.trim(),
            lastName: raw.lastName!.trim(),
            email: raw.email!.trim()
        }, Array.from(this.createRoleNames()));
    }

    /** Leva o foco ao primeiro campo inválido do formulário — quem envia pelo teclado não precisa procurar o erro. */
    private focusFirstInvalid(containerSelector: string): void {
        afterNextRender(() => {
            document.querySelector<HTMLElement>(`${containerSelector} .is-invalid`)?.focus();
        }, { injector: this.injector });
    }

    /**
     * Fecha o ciclo de um cadastro bem-sucedido: avisa (toast, ou alerta de sucesso parcial quando
     * só as funções falharam), destaca a linha nova e, em "Convidar e cadastrar outro", limpa o
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
        if (this.highlightTimer) clearTimeout(this.highlightTimer);
        this.highlightTimer = setTimeout(() => {
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
            this.focusFirstInvalid('#userEditModal');
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

    /** Marca ou desmarca uma função no modal de atribuição. */
    toggleRole(roleName: string, checked: boolean): void {
        this.selectedRoleNames.update(current => toggleInSet(current, roleName, checked));
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

    /** Salva as funções marcadas (substitui as atuais) — recusado se tiraria do próprio admin o acesso. */
    onAssignRolesSubmit(): void {
        const user = this.selectedUser();
        if (!user || this.removesOwnAdminAccess()) return;

        this.store.assignRoles(user.id, Array.from(this.selectedRoleNames()), () => {
            this.closeDialog();
            this.toastService.show(`Funções de "${user.firstName} ${user.lastName}" atualizadas.`);
        });
    }

    /** Situação do usuário pro badge e pras ações (Ativo, Convite pendente, Inativo). */
    statusOf(user: UserSummary): UserStatusKind {
        return userStatusKind(user);
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

    /** Se há uma ação em andamento na linha (contando chamados, desativando, reativando, reenviando convite) — vira spinner no ⋮. */
    isRowBusy(userId: string): boolean {
        return this.store.countingTicketsIds().includes(userId)
            || this.store.deactivatingIds().includes(userId)
            || this.store.activatingIds().includes(userId)
            || this.store.resendingInvitationIds().includes(userId);
    }

    /**
     * Devolve o foco ao "⋮" da linha (a confirmação e o toast o tiraram dali, e o item clicado do
     * menu deixou de existir). Sem a linha — saiu da lista com o filtro —, o foco vai pra busca.
     */
    private focusRowActions(userId: string): void {
        afterNextRender(() => {
            const target = document.querySelector<HTMLElement>(`[data-row-actions="${userId}"]`)
                ?? document.getElementById('userSearch');
            target?.focus();
        }, { injector: this.injector });
    }

    /**
     * Desativa o usuário, avisando antes quantos chamados em aberto ele atende — num helpdesk, a
     * pergunta real ao bloquear alguém é o que acontece com a fila dele (achado do critique de
     * 2026-10-27). Conta pendente de ativação não tem chamados: pula a consulta. Enquanto conta, o
     * "⋮" gira e um segundo clique não abre outra contagem.
     */
    onDeactivate(user: UserSummary): void {
        if (user.pendingActivation) {
            this.confirmDeactivate(user, 0);
            return;
        }
        this.store.countOpenAssignedTickets(user.id, count => this.confirmDeactivate(user, count));
    }

    /**
     * Confirma e desativa, bloqueando o acesso. Os chamados em aberto continuam atribuídos (o
     * back-end não os devolve à fila), então o aviso orienta a reatribuir. O toast de sucesso
     * oferece "Desfazer" (reativa na hora). Textos sem gênero gramatical: o nome não diz o gênero.
     */
    private confirmDeactivate(user: UserSummary, openTickets: number | null): void {
        const name = `${user.firstName} ${user.lastName}`;
        const ticketsWarning = openTickets && openTickets > 0
            ? ` ${name} atende ${openTickets === 1 ? '1 chamado em aberto, que continua atribuído' : `${openTickets} chamados em aberto, que continuam atribuídos`} a essa pessoa: reatribua em Monitorar Chamados.`
            : '';
        this.confirmDialogService.confirm({
            title: `Desativar "${name}"?`,
            message: `O acesso de ${name} ao Tickest é bloqueado na hora.${ticketsWarning} Dá pra reativar depois.`,
            confirmLabel: 'Desativar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) {
                this.focusRowActions(user.id);
                return;
            }
            this.store.deactivate(user.id, () => {
                this.toastService.show(`Acesso de "${name}" desativado.`, 'success', {
                    label: 'Desfazer',
                    run: () => this.store.activate(user.id, () => this.toastService.show(`Acesso de "${name}" reativado.`))
                });
                this.focusRowActions(user.id);
            });
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
            if (!confirmed) {
                this.focusRowActions(user.id);
                return;
            }
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
                this.focusRowActions(user.id);
            });
        });
    }

    /** Reenvia o convite de ativação; o anterior deixa de valer. */
    onResendInvitation(user: UserSummary): void {
        this.store.resendInvitation(user.id, () => {
            this.toastService.show(`Novo convite enviado para ${user.email}. O anterior deixou de valer.`);
            this.focusRowActions(user.id);
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

    /** Marca ou desmarca um usuário na seleção em lote. */
    toggleSelection(userId: string, checked: boolean): void {
        this.selectedUserIds.update(current => toggleInSet(current, userId, checked));
    }

    /** Quantidade de usuários selecionados. */
    selectedCount(): number {
        return this.selectedUserIds().size;
    }

    /** Marca ou desmarca de uma vez todos os usuários elegíveis da página atual. */
    toggleSelectAll(checked: boolean): void {
        this.selectedUserIds.set(checked ? new Set(this.eligibleUsersForBulk().map(user => user.id)) : new Set());
    }

    /** Limpa a seleção em lote e leva o foco ao "selecionar todos" — a barra de lote, onde ele estava, some. */
    clearSelection(): void {
        this.selectedUserIds.set(new Set());
        this.focusSelectAll();
    }

    /** Foca o "selecionar todos" visível (o do cabeçalho no desktop, a linha própria no celular); sem nenhum, a busca. */
    private focusSelectAll(): void {
        afterNextRender(() => {
            const candidates = ['userSelectAll', 'userSelectAllMobile', 'userSearch']
                .map(id => document.getElementById(id))
                .filter((element): element is HTMLElement => !!element && element.offsetParent !== null && !(element as HTMLInputElement).disabled);
            candidates[0]?.focus();
        }, { injector: this.injector });
    }

    /**
     * Confirma e desativa em lote. Mesmo amparo do individual: conta antes os chamados em aberto
     * dos selecionados (aviso pra reatribuir; se a contagem falhar, confirma sem ele), lista os
     * nomes (até {@link BULK_NAMES_SHOWN}, depois "e mais N") e oferece "Desfazer" no toast —
     * achado do critique de 2026-10-28: o fluxo mais arriscado da tela era o menos amparado.
     */
    onBulkDeactivate(): void {
        const userIds = Array.from(this.selectedUserIds());
        if (userIds.length === 0 || this.bulkBusy()) return;

        this.store.countOpenAssignedTicketsMany(userIds, result => this.confirmBulkDeactivate(userIds, result));
    }

    /** Segunda metade de {@link onBulkDeactivate}: a confirmação, a desativação e o retorno. */
    private confirmBulkDeactivate(userIds: string[], openTickets: { tickets: number; people: number } | null): void {
        const names = this.store.users()
            .filter(user => userIds.includes(user.id))
            .map(user => `${user.firstName} ${user.lastName}`);
        const label = userIds.length === 1 ? '1 usuário selecionado' : `${userIds.length} usuários selecionados`;
        const ticketsWarning = openTickets && openTickets.tickets > 0
            ? ` ${openTickets.people === 1 ? '1 dessas pessoas atende' : `${openTickets.people} dessas pessoas atendem`} ${openTickets.tickets === 1 ? '1 chamado em aberto, que continua atribuído' : `${openTickets.tickets} chamados em aberto, que continuam atribuídos`}: reatribua em Monitorar Chamados.`
            : '';

        this.confirmDialogService.confirm({
            title: `Desativar ${label}?`,
            message: `${joinNames(names)}. O acesso dessas pessoas ao Tickest é bloqueado na hora.${ticketsWarning} Dá pra desfazer logo depois.`,
            confirmLabel: 'Desativar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) {
                this.focusSelectAll();
                return;
            }

            this.store.deactivateMany(userIds, (succeededIds, failedCount) => {
                this.clearSelection();
                const undo = { label: 'Desfazer', run: () => this.undoBulkDeactivate(succeededIds) };
                if (failedCount === 0) {
                    this.toastService.show(succeededIds.length === 1 ? '1 usuário desativado.' : `${succeededIds.length} usuários desativados.`, 'success', undo);
                } else if (succeededIds.length > 0) {
                    this.toastService.show(`${succeededIds.length} de ${succeededIds.length + failedCount} usuários desativados. ${this.store.listMutationError() ?? ''}`.trim(), 'info', undo);
                } else {
                    this.toastService.show(`Nenhum usuário foi desativado. ${this.store.listMutationError() ?? ''}`.trim(), 'danger');
                }
            });
        });
    }

    /** "Desfazer" da desativação em lote: reativa quem foi desativado agora. */
    private undoBulkDeactivate(userIds: string[]): void {
        this.store.activateMany(userIds, (succeededCount, failedCount) => {
            if (failedCount === 0) {
                this.toastService.show(succeededCount === 1 ? '1 usuário reativado.' : `${succeededCount} usuários reativados.`);
            }
        });
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
     * Aplica o período só se for coerente ("de" até "até"); invertido (digitado, já que o
     * calendário já limita com `min`/`max`), mantém o último período válido e explica o problema
     * abaixo dos campos — antes a tela só mostrava "Nenhum usuário encontrado", sem dizer por quê.
     */
    private applyPeriod(createdFrom: string | undefined, createdTo: string | undefined): void {
        if (createdFrom && createdTo && createdFrom > createdTo) {
            this.periodError.set('A data inicial precisa ser igual ou anterior à data final. Mantivemos o período anterior.');
            return;
        }

        this.periodError.set(null);
        this.store.setPeriod(createdFrom, createdTo);
    }

    /** Muda a quantidade de itens exibidos por página. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Limpa todos os filtros, incluindo o campo de busca local, e leva o foco à busca (o botão some). */
    onClearFilters(): void {
        this.searchInput.set('');
        this.periodError.set(null);
        this.store.clearFilters();
        afterNextRender(() => document.getElementById('userSearch')?.focus(), { injector: this.injector });
    }
}
