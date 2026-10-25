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
import { SessionService, ToastService } from '../../shared';
import { UserSummary } from '../../users';
import { TicketMonitorGuideComponent } from './ticket-monitor-guide.component';
import { TicketMonitorInfoPanelComponent } from './ticket-monitor-info-panel.component';
import { TicketMonitorInsightsComponent } from './ticket-monitor-insights.component';

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
    imports: [CommonModule, RouterLink, TicketMonitorGuideComponent, TicketMonitorInfoPanelComponent, TicketMonitorInsightsComponent],
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

    /** Texto digitado na busca de candidatos do modal "Atribuir responsável", antes do debounce. */
    readonly responsibleSearchInput = signal('');

    /** Ticket para o qual o modal "Atribuir responsável" está aberto — `undefined` quando fechado. */
    readonly assigningResponsibleTicketId = signal<string | undefined>(undefined);

    constructor() {
        // O painel busca a descrição completa (único campo que a linha da tabela não tem) do
        // ticket selecionado; trocar a seleção rápido cancela a busca anterior automaticamente
        // (characteristic do rxResource, que troca de observable a cada mudança de `ticketId`).
        effect(() => this.quickInfoStore.select(this.selectedTicketId()));

        // Espera ~300ms após a última tecla antes de buscar, pra não buscar a cada letra digitada
        // (mesmo padrão do modal de atribuição do detalhe do chamado).
        toObservable(this.responsibleSearchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.searchResponsibleCandidates(search));

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
     * juntos e escolher um estado pós-resolução (Cumprido/Violado/Sem SLA) deixava os 4 cards sem
     * nenhum destaque, um filtro aplicado sem feedback visual em nenhum lugar (achado no critique
     * de 2026-10-24). Agrupar deixa explícito que são duas perguntas diferentes, sem remover a
     * capacidade de filtrar por desfecho histórico de SLA.
     */
    readonly liveSlaStatusOptions: TicketSlaStatus[] = [TicketSlaStatus.OnTime, TicketSlaStatus.AtRisk, TicketSlaStatus.Breached];

    /** Estados de chamados já resolvidos (desfecho final do SLA), separados dos "em monitoramento" acima. */
    readonly resolvedSlaStatusOptions: TicketSlaStatus[] = [TicketSlaStatus.Met, TicketSlaStatus.Missed, TicketSlaStatus.NotApplicable];

    readonly sortOptions = Object.values(TicketSortOrder).filter((v): v is TicketSortOrder => typeof v === 'number');

    readonly pageSizeOptions = [10, 20, 50];

    /**
     * Restaura busca, filtros, ordenação, página e tamanho da página a partir da query string
     * (RF-28) — recarregar, voltar ou compartilhar o link reproduz o mesmo estado. Parâmetro
     * ausente ou inválido (fora do enum, não-numérico etc.) volta ao padrão, nunca quebra a tela.
     * Cobre também o `?status=`/`?unassignedOnly=` vindo dos cards/atalhos do Dashboard — são só
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

    /** Seleciona o ticket clicado/ativado; clicar de novo no já selecionado desseleciona. */
    selectTicket(ticketId: string): void {
        if (this.selectedTicketId() === ticketId) {
            this.closeInfoPanel();
            return;
        }

        this.lastFocusedElement = document.activeElement as HTMLElement;
        this.selectedTicketId.set(ticketId);
    }

    /** Fecha o painel "Informações do Ticket" (clique no X, no backdrop, ou tecla Esc) e devolve o foco a quem o abriu. */
    closeInfoPanel(): void {
        this.selectedTicketId.set(undefined);
        this.lastFocusedElement?.focus();
        this.lastFocusedElement = null;
    }

    /** Esc fecha o painel "Informações do Ticket", de qualquer lugar da tela — essencial no overlay de tela cheia, sem botão "fora" pra clicar. */
    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
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

    /** Índice (1-based) do primeiro item exibido na página atual, para o texto "Exibindo X–Y de Z". */
    rangeStart(): number {
        return this.store.total() === 0 ? 0 : (this.store.currentPage() - 1) * this.store.currentPageSize() + 1;
    }

    /** Índice (1-based) do último item exibido na página atual, para o texto "Exibindo X–Y de Z". */
    rangeEnd(): number {
        return Math.min(this.store.currentPage() * this.store.currentPageSize(), this.store.total());
    }

    /**
     * Janela de números de página pro rodapé: sempre mostra a primeira, a última e as vizinhas da
     * atual, com "…" nos saltos — pra não listar 1 botão por página quando há muitas.
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

        this.store.assignToMe(ticketId, currentUserId, () => this.toastService.show('Ticket atribuído a você.'));
    }

    /** Indica se o botão "Atribuir responsável" deve aparecer: chamado ativo, pra quem administra a fila (com ou sem responsável atual, pra permitir reatribuir). */
    canAssignResponsible(ticket: TicketMonitorItem): boolean {
        return this.sessionService.hasPermission('tickets:manage') && TICKET_ACTIVE_STATUSES.has(ticket.status);
    }

    /** Abre o modal "Atribuir responsável" para o ticket clicado, limpando a busca de uma abertura anterior. */
    onOpenAssignResponsibleModal(ticketId: string): void {
        this.assigningResponsibleTicketId.set(ticketId);
        this.responsibleSearchInput.set('');
        this.store.clearResponsibleSearch();
    }

    /** Atribui o candidato escolhido no modal como responsável do ticket aberto, e fecha o modal em caso de sucesso. */
    onSelectResponsibleCandidate(candidate: UserSummary): void {
        const ticketId = this.assigningResponsibleTicketId();
        if (!ticketId) return;

        this.store.assignResponsible(ticketId, candidate.id, () => {
            this.toastService.show(`${candidate.firstName} ${candidate.lastName} agora é o responsável.`);
            document.getElementById('monitorAssignResponsibleModalCloseButton')?.click();
        });
    }
}
