import { Component, inject, OnInit, ChangeDetectionStrategy, effect, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TicketMonitorStore } from '../application/ticket-monitor.store';
import { TicketQuickInfoStore } from '../application/ticket-quick-info.store';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketMonitorFilters } from '../entities/ticket-monitor-filters';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS, TICKET_ACTIVE_STATUSES } from '../entities/ticket-status';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TicketSortOrder, TICKET_SORT_ORDER_LABELS } from '../entities/ticket-sort-order';
import { DepartmentsStore } from '../../departments';
import { SessionService, ToastService, injectSidePanelOverlay, isEscapeFromNestedLayer } from '../../shared';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { TicketMonitorGuideComponent } from './ticket-monitor-guide.component';
import { TicketMonitorInfoPanelComponent } from './ticket-monitor-info-panel.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { StatCardComponent, StatTone } from '../../shared/ui/stat-card/stat-card.component';
import { TicketAssignDialogComponent } from '../ui/ticket-assign-dialog/ticket-assign-dialog.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar/filter-bar.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';

const DEFAULT_SORT = TicketSortOrder.Newest;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Lê um valor numérico da query string só se ele bater com um dos valores aceitos; senão, `undefined`. */
function parseEnumParam<T extends number>(value: string | null, validValues: readonly T[]): T | undefined {
    if (value === null) return undefined;
    const parsed = Number(value);
    return validValues.includes(parsed as T) ? (parsed as T) : undefined;
}

/** Lê um inteiro positivo da query string; se ausente, inválido ou fora da lista aceita, devolve o padrão. */
function parsePageSizeParam(value: string | null): number {
    if (value === null) return DEFAULT_PAGE_SIZE;
    const parsed = Number(value);
    return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

/** Lê um inteiro positivo (página); se ausente ou inválido, devolve 1 — a correção pra última página válida acontece depois do carregamento (EC-09). */
function parsePageParam(value: string | null): number {
    if (value === null) return DEFAULT_PAGE;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
}

/** Tela de "Monitorar Tickets": todos os chamados do sistema, com filtros e resumo de SLA (role Administrador/Atendente, permissão tickets:manage). */
@Component({
    selector: 'app-ticket-monitor',
    imports: [CommonModule, RouterLink, PageHeaderComponent, RowActionsComponent, TicketMonitorGuideComponent, TicketMonitorInfoPanelComponent, PaginationComponent, FilterBarComponent, EmptyStateComponent, LoadingStateComponent, StatCardComponent, TicketAssignDialogComponent],
    templateUrl: './ticket-monitor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-monitor.component.css'
})
export class TicketMonitorComponent implements OnInit {
    protected readonly store = inject(TicketMonitorStore);
    protected readonly quickInfoStore = inject(TicketQuickInfoStore);
    protected readonly departmentsStore = inject(DepartmentsStore);
    protected readonly sessionService = inject(SessionService);
    private readonly toastService = inject(ToastService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    /**
     * Ticket selecionado na tabela — estado de UI puro (não é parâmetro de busca da API, não entra
     * em {@link TicketMonitorFilters}/`TicketMonitorStore`), só sincronizado com a URL (query param
     * `ticketId`) pra sobreviver a recarregar ou compartilhar o link. Preparação pra fatia 4
     * (painel "Informações do Ticket"), que ainda vai consumir esse id.
     */
    readonly selectedTicketId = signal<string | undefined>(undefined);

    /**
     * Ticket selecionado, com os dados já carregados na tabela — `undefined` tanto sem seleção
     * quanto quando o id selecionado não está (mais) na página/filtro atual (ex.: veio de uma URL
     * compartilhada com outro filtro). Fonte única pro painel "Informações do Ticket" (fatia 4).
     */
    readonly selectedTicket = computed(() => this.store.tickets().find(t => t.id === this.selectedTicketId()));

    /** Texto digitado na busca por título, antes do debounce. */
    readonly searchInput = signal('');

    /** Os 4 cards de SLA do topo: rótulo, contagem do resumo, legenda, ícone, tom e o filtro que aplicam. */
    protected readonly slaCards: { label: string; count: 'activeCount' | 'onTimeCount' | 'atRiskCount' | 'breachedCount'; hint: string; icon: string; tone: StatTone; slaStatus: TicketSlaStatus | undefined }[] = [
        { label: 'Ativos', count: 'activeCount', hint: 'Com o relógio do SLA correndo', icon: 'bx-receipt', tone: 'primary', slaStatus: undefined },
        { label: 'No Prazo', count: 'onTimeCount', hint: 'Dentro do SLA', icon: 'bx-check-circle', tone: 'success', slaStatus: TicketSlaStatus.OnTime },
        { label: 'Em Risco', count: 'atRiskCount', hint: 'Perto de vencer', icon: 'bx-error-circle', tone: 'warning', slaStatus: TicketSlaStatus.AtRisk },
        { label: 'Atrasados', count: 'breachedCount', hint: 'Já passaram do prazo', icon: 'bx-error', tone: 'danger', slaStatus: TicketSlaStatus.Breached }
    ];

    /** Se a linha "Mais filtros" (Prioridade, Ordenar, Só sem responsável) está aberta. */
    readonly moreFiltersOpen = signal(false);

    /** Quantos filtros da linha "Mais filtros" estão aplicados — mostrado no botão e usado pra abri-la sozinha. */
    readonly secondaryFilterCount = computed(() => {
        const filters = this.store.filters();
        return (filters.priority !== undefined ? 1 : 0)
            + (filters.sort !== TicketSortOrder.Newest ? 1 : 0);
    });

    /** Contagem de um card de SLA no resumo carregado (`null` enquanto não há resumo). */
    slaCount(count: 'activeCount' | 'onTimeCount' | 'atRiskCount' | 'breachedCount'): number | null {
        return this.store.slaSummary()?.[count] ?? null;
    }

    /** Valor do filtro "Responsável": qualquer um, só os atribuídos a quem está logado, ou só os sem responsável. */
    readonly responsibleFilter = computed<'any' | 'me' | 'none'>(() => {
        const filters = this.store.filters();
        if (filters.unassignedOnly) return 'none';
        if (filters.assignedToUserId && filters.assignedToUserId === this.sessionService.currentUser()?.id) return 'me';
        return 'any';
    });

    /** Aplica o filtro "Responsável" escolhido. */
    onResponsibleFilterChange(value: 'any' | 'me' | 'none'): void {
        if (value === 'none') {
            this.store.setUnassignedOnly(true);
        } else if (value === 'me') {
            this.store.setAssignedToUserId(this.sessionService.currentUser()?.id);
        } else {
            this.store.setUnassignedOnly(false);
            this.store.setAssignedToUserId(undefined);
        }
    }

    /** Abre ou fecha a linha "Mais filtros". */
    toggleMoreFilters(): void {
        this.moreFiltersOpen.update(open => !open);
    }

    /** Ticket para o qual o diálogo "Atribuir responsável" está aberto — `undefined` quando fechado. */
    readonly assigningResponsibleTicketId = signal<string | undefined>(undefined);

    /** Chamado (da página atual) cujo diálogo "Atribuir responsável" está aberto. */
    readonly assigningResponsibleTicket = computed(() => {
        const ticketId = this.assigningResponsibleTicketId();
        return ticketId ? this.store.tickets().find(ticket => ticket.id === ticketId) ?? null : null;
    });

    constructor() {
        // O painel busca a descrição completa (único campo que a linha da tabela não tem) do
        // ticket selecionado; trocar a seleção rápido cancela a busca anterior automaticamente
        // (characteristic do rxResource, que troca de observable a cada mudança de `ticketId`).
        effect(() => this.quickInfoStore.select(this.selectedTicketId()));

        // Espera ~300ms após a última tecla antes de buscar por título, pra não buscar a cada
        // letra digitada — mesmo padrão já usado no resto do app (ex.: busca de Usuários).
        toObservable(this.searchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.setSearch(search));


        // Toda mudança de filtro/ordenação/página/seleção se reflete na URL (RF-28), sem empilhar
        // histórico a cada alternância — "Voltar" deve levar pra fora da tela, não filtro por
        // filtro. Só navega quando o alvo realmente difere da URL atual — evita regravar (e reagir
        // de novo) o mesmo estado que acabou de ser lido dela, ao inicializar.
        effect(() => {
            const queryParams = { ...this.filtersToQueryParams(this.store.filters()), ticketId: this.selectedTicketId() ?? null };
            if (this.matchesCurrentUrl(queryParams)) return;

            this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
        });

        // Página alvo além do total (ex.: vinda de uma URL salva de quando havia mais resultados)
        // volta pra última página válida, em vez de mostrar uma tabela vazia (EC-09).
        effect(() => {
            const totalPages = this.store.totalPages();
            const currentPage = this.store.filters().page;
            if (totalPages > 0 && currentPage > totalPages) {
                this.store.goToPage(totalPages);
            }
        });
    }

    /** Exposto pro template clicar nos cards de resumo de SLA e filtrar a tabela pelo mesmo valor. */
    protected readonly TicketSlaStatus = TicketSlaStatus;

    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;
    readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
    readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
    readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
    readonly sortOrderLabels = TICKET_SORT_ORDER_LABELS;

    readonly statusOptions = Object.values(TicketStatus).filter((v): v is TicketStatus => typeof v === 'number');
    readonly priorityOptions = Object.values(TicketPriority).filter((v): v is TicketPriority => typeof v === 'number');

    /**
     * Estados "em monitoramento" (chamado ainda ativo, relógio do SLA correndo) — os mesmos que os
     * 4 cards de resumo reconhecem e destacam via `aria-pressed`. Separado dos estados "já
     * resolvidos" abaixo num `<optgroup>` próprio: antes, o dropdown oferecia os 6 valores do enum
     * juntos e escolher um estado pós-resolução (Cumprido/Resolvido com atraso/Sem SLA) deixava os 4 cards sem
     * nenhum destaque, um filtro aplicado sem feedback visual em nenhum lugar (achado no critique
     * de 2026-10-24). Agrupar deixa explícito que são duas perguntas diferentes, sem remover a
     * capacidade de filtrar por desfecho histórico de SLA.
     */
    readonly liveSlaStatusOptions: TicketSlaStatus[] = [TicketSlaStatus.OnTime, TicketSlaStatus.AtRisk, TicketSlaStatus.Breached];

    /** Estados de chamados já resolvidos (desfecho final do SLA), separados dos "em monitoramento" acima. */
    readonly resolvedSlaStatusOptions: TicketSlaStatus[] = [TicketSlaStatus.Met, TicketSlaStatus.Missed, TicketSlaStatus.NotApplicable];

    readonly sortOptions = Object.values(TicketSortOrder).filter((v): v is TicketSortOrder => typeof v === 'number');

    readonly pageSizeOptions = [10, 20, 50];

    /** Se a janela está abaixo de "lg", onde o painel "Informações do Ticket" vira um diálogo modal de tela cheia. */
    readonly isOverlayViewport = injectSidePanelOverlay();

    /**
     * Restaura busca, filtros, ordenação, página e tamanho da página a partir da query string
     * (RF-28) — recarregar, voltar ou compartilhar o link reproduz o mesmo estado. Parâmetro
     * ausente ou inválido (fora do enum, não-numérico etc.) volta ao padrão, nunca quebra a tela.
     * Cobre também o `?status=`/`?unassignedOnly=`/`?assignedToMe=` vindo dos cards/atalhos do Início — são só
     * casos particulares do mesmo mecanismo, não um caminho separado.
     *
     * O termo de busca livre fica de fora de propósito: incluir texto livre na URL colidiria com
     * a proibição de dado pessoal na URL (RNF-32) — a própria SPEC pede as duas coisas em
     * requisitos diferentes (RF-28 inclui "busca"; RNF-32 proíbe "texto livre" na URL). Resolvido
     * a favor da proibição, mesma decisão já tomada antes para o equivalente (DP-03).
     *
     * Os departamentos (para o filtro de setor) não são recarregados aqui: o `DepartmentsStore`
     * já os busca sozinho ao ser injetado pela primeira vez na sessão, e esta tela só lê esse dado.
     */
    ngOnInit(): void {
        const params = this.route.snapshot.queryParamMap;

        const filters: TicketMonitorFilters = {
            status: parseEnumParam(params.get('status'), this.statusOptions),
            priority: parseEnumParam(params.get('priority'), this.priorityOptions),
            sectorId: params.get('sectorId') || undefined,
            slaStatus: parseEnumParam(params.get('slaStatus'), [...this.liveSlaStatusOptions, ...this.resolvedSlaStatusOptions]),
            unassignedOnly: params.get('unassignedOnly') === 'true' ? true : undefined,
            // "?assignedToMe=true" (atalho do Início) vira o id de quem está logado — o id não vai pra URL.
            assignedToUserId: params.get('assignedToMe') === 'true' && params.get('unassignedOnly') !== 'true'
                ? this.sessionService.currentUser()?.id
                : undefined,
            sort: parseEnumParam(params.get('sort'), this.sortOptions) ?? DEFAULT_SORT,
            page: parsePageParam(params.get('page')),
            pageSize: parsePageSizeParam(params.get('pageSize'))
        };

        this.store.hydrateFiltersFromUrl(filters);
        this.selectedTicketId.set(params.get('ticketId') || undefined);
        this.store.load();
    }

    /**
     * Elemento com foco no momento em que o painel "Informações do Ticket" foi aberto — pra devolver
     * o foco a ele ao fechar (RF-04), em vez de deixá-lo "perdido" no topo da página. Importa
     * principalmente no overlay de tela cheia (abaixo de "lg"), onde o elemento que abriu o painel
     * fica fora da área visível enquanto ele está aberto.
     */
    private lastFocusedElement: HTMLElement | null = null;

    /**
     * Seleciona o ticket clicado/ativado; clicar de novo no já selecionado desseleciona. `focusReturn`
     * é o botão do título da linha — recebe o foco ao fechar o painel mesmo quando a abertura foi um
     * clique de mouse na linha (que não deixa nenhum elemento focado).
     */
    selectTicket(ticketId: string, focusReturn?: HTMLElement): void {
        if (this.selectedTicketId() === ticketId) {
            this.closeInfoPanel();
            return;
        }

        this.lastFocusedElement = focusReturn ?? document.activeElement as HTMLElement;
        this.selectedTicketId.set(ticketId);
    }

    /** Fecha o painel "Informações do Ticket" (clique no X, no backdrop, ou tecla Esc) e devolve o foco a quem o abriu. */
    closeInfoPanel(): void {
        this.selectedTicketId.set(undefined);
        this.lastFocusedElement?.focus();
        this.lastFocusedElement = null;
    }

    /**
     * Esc fecha o painel "Informações do Ticket", de qualquer lugar da tela — essencial no overlay
     * de tela cheia, sem botão "fora" pra clicar. Exceto quando o Esc nasce dentro de um modal
     * ("Atribuir responsável", confirmação) ou de um menu "⋮": ali ele só fecha aquela camada, sem
     * levar o painel junto.
     */
    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: Event): void {
        if (isEscapeFromNestedLayer(event)) return;

        if (this.selectedTicketId()) {
            this.closeInfoPanel();
        }
    }

    /** Converte os filtros atuais no formato aceito por `Router.navigate`, omitindo valores padrão pra manter a URL curta. */
    private filtersToQueryParams(filters: TicketMonitorFilters): Record<string, string | number | null> {
        return {
            status: filters.status ?? null,
            priority: filters.priority ?? null,
            sectorId: filters.sectorId ?? null,
            slaStatus: filters.slaStatus ?? null,
            unassignedOnly: filters.unassignedOnly ? 'true' : null,
            assignedToMe: filters.assignedToUserId ? 'true' : null,
            sort: filters.sort === DEFAULT_SORT ? null : filters.sort,
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

    /**
     * Filtra pelo balde de SLA clicado E ordena por prazo mais próximo — confirmado com o back-end
     * que, pra chamados ativos, ordenar por `DueAtUtc` ascendente já é matematicamente idêntico a
     * "mais urgente primeiro" (não existe nem precisa existir um "score de urgência" separado).
     * O que faltava não era uma ordenação nova, era a composição: os cards de SLA (que o critique
     * de 2026-10-24 apontou como sem jeito de ordenar por urgência) já tinham a peça certa
     * (`TicketSortOrder.DueDate`) disponível, só não a acionavam.
     */
    onSlaCardClick(slaStatus: TicketSlaStatus | undefined): void {
        this.store.setSlaStatus(slaStatus);
        this.store.setSort(TicketSortOrder.DueDate);
    }

    /** Limpa todos os filtros, incluindo o texto de busca ainda não aplicado (debounce em andamento). */
    onClearFilters(): void {
        this.searchInput.set('');
        this.store.clearFilters();
    }

    /** Muda a quantidade de itens por página. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Indica se o chamado já passou do prazo e ainda não foi resolvido, para destacar a data na tabela. */
    isOverdue(ticket: TicketMonitorItem): boolean {
        return !ticket.resolvedAtUtc && new Date(ticket.dueAtUtc).getTime() < Date.now();
    }

    /** Indica se o botão "Atribuir a mim" deve aparecer: chamado ativo, sem responsável, pra quem administra a fila. */
    canAssignToMe(ticket: TicketMonitorItem): boolean {
        return this.sessionService.hasPermission('tickets:manage') && TICKET_ACTIVE_STATUSES.has(ticket.status) && ticket.assignedToUserId === null;
    }

    /** Atribui o chamado ao usuário logado, direto na linha da tabela. */
    onAssignToMe(ticketId: string): void {
        const currentUserId = this.sessionService.currentUser()?.id;
        if (!currentUserId) return;

        this.store.assignToMe(ticketId, currentUserId, () => this.toastService.show('Chamado atribuído a você.'));
    }

    /** Indica se o botão "Atribuir responsável" deve aparecer: chamado ativo, pra quem administra a fila (com ou sem responsável atual, pra permitir reatribuir). */
    canAssignResponsible(ticket: TicketMonitorItem): boolean {
        return this.sessionService.hasPermission('tickets:manage') && TICKET_ACTIVE_STATUSES.has(ticket.status);
    }

    /** Abre o diálogo "Atribuir responsável" para o ticket clicado, sem herdar a busca nem o erro de uma abertura anterior. */
    onOpenAssignResponsibleModal(ticketId: string): void {
        this.store.clearResponsibleSearch();
        this.store.clearMutationError();
        this.assigningResponsibleTicketId.set(ticketId);
    }

    /** Atribui o candidato confirmado no diálogo como responsável do ticket aberto, e fecha o diálogo em caso de sucesso. */
    onConfirmResponsible(choice: { userId: string; name: string }): void {
        const ticketId = this.assigningResponsibleTicketId();
        if (!ticketId) return;

        this.store.assignResponsible(ticketId, choice.userId, () => {
            this.toastService.show(`${choice.name} agora é o responsável.`);
            this.assigningResponsibleTicketId.set(undefined);
        });
    }
}
