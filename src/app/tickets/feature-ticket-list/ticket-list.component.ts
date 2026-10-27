import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, effect, ElementRef, Injector, DestroyRef, afterNextRender, viewChild } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { TicketsStore } from '../application/tickets.store';
import { Ticket } from '../entities/ticket';
import { TicketStatus, TICKET_ACTIVE_STATUSES, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TicketStatusGroup, TICKET_STATUS_GROUP_URL_VALUES } from '../entities/ticket-status-group';
import { ConfirmDialogService, ToastService } from '../../shared';
import { DepartmentsStore } from '../../departments';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { TicketEditDialogComponent } from '../ui/ticket-edit-dialog/ticket-edit-dialog.component';
import { TicketReopenDialogComponent } from '../ui/ticket-reopen-dialog/ticket-reopen-dialog.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { FilterBarComponent } from '../../shared/ui/filter-bar/filter-bar.component';
import { TicketListGuideComponent } from './ticket-list-guide.component';

/** Formato da data completa da última atividade, para o leitor de tela e o tooltip. */
const FULL_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** Formato da data curta, para atividades de mais de uma semana. */
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/**
 * Tempo desde a última atividade, em pt-BR curto: "agora há pouco", "há 35 min", "há 2 h",
 * "ontem", "há 3 dias" e, a partir de uma semana, a data ("12/09/2026"). Relógio do navegador
 * contra a data UTC da API; diferença negativa (relógio adiantado no servidor) vira "agora há pouco".
 */
export function formatLastActivity(isoUtc: string, nowMs: number): string {
    const diffMinutes = Math.floor((nowMs - new Date(isoUtc).getTime()) / 60_000);
    if (diffMinutes < 1) return 'agora há pouco';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 2) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    return SHORT_DATE_FORMAT.format(new Date(isoUtc));
}

/** Tela de listagem dos tickets do usuário logado. */
@Component({
    selector: 'app-ticket-list',
    imports: [CommonModule, RouterLink, PageHeaderComponent, RowActionsComponent, TicketEditDialogComponent, TicketReopenDialogComponent, PaginationComponent, LoadingStateComponent, EmptyStateComponent, FilterBarComponent, TicketListGuideComponent],
    templateUrl: './ticket-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
    protected readonly store = inject(TicketsStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly toastService = inject(ToastService);
    private readonly departmentsStore = inject(DepartmentsStore);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly injector = inject(Injector);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    /** Cabeçalho da tela — recebe o foco quando o \"⋮\" de origem não existe mais. */
    private readonly pageHeader = viewChild(PageHeaderComponent);

    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
    readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;

    /** Opções do seletor de grupo, na ordem da tela; "Em aberto" é o padrão. */
    readonly statusGroupOptions: { key: keyof typeof TICKET_STATUS_GROUP_URL_VALUES; label: string; value: TicketStatusGroup | null }[] = [
        { key: 'active', label: 'Em aberto', value: TicketStatusGroup.Active },
        { key: 'finished', label: 'Encerrados', value: TicketStatusGroup.Finished },
        { key: 'all', label: 'Todos', value: null }
    ];

    /** Enum exposto ao template, pras saídas dos estados vazios ("Ver encerrados", "Ver em aberto"). */
    readonly statusGroup = TicketStatusGroup;

    /**
     * Mostra "Carregando…" na primeira carga e enquanto a sondagem decide entre primeiro uso e
     * "nada pendente" — sem isso, o estado vazio errado piscava antes do certo.
     */
    readonly isLoadingList = computed(() => {
        if (this.store.tickets().length > 0 || this.store.loadError()) return false;
        return this.store.state().loading || this.store.hasAnyTicket() === null;
    });

    /** Texto digitado na busca por título, antes do debounce. */
    readonly searchInput = signal('');

    /** Hora atual do navegador, atualizada a cada minuto, pro "atualizado há X" andar sozinho. */
    readonly now = signal(Date.now());

    /** Indica se o filtro está fora do padrão (Em aberto, sem busca) — mostra o "Limpar filtros". */
    readonly hasCustomFilters = computed(() =>
        this.store.statusGroup() !== TicketStatusGroup.Active || this.store.search() !== '');

    /**
     * Departamentos que atendem tickets (os que têm setor), em lista por extenso ("TI, RH e
     * Financeiro") — mostrados no estado vazio de primeiro uso. Vazio enquanto carrega ou se falhar.
     */
    readonly attendingDepartments = computed(() => {
        const names = this.departmentsStore.departments()
            .filter(department => department.sectors.length > 0)
            .map(department => department.name);
        return names.length > 0 ? new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(names) : '';
    });

    /** Opções de itens por página no rodapé da listagem. */
    readonly pageSizeOptions = [10, 20, 50];

    /** Ticket em edição no modal de descrição (null quando o modal está fechado). */
    editingTicket = signal<Ticket | null>(null);

    /** Ticket em reabertura no modal de motivo (null quando o modal está fechado). */
    reopeningTicket = signal<Ticket | null>(null);

    constructor() {
        // Busca com debounce, como no Monitor: só pergunta à API quando a pessoa para de digitar.
        toObservable(this.searchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.setSearch(search));

        // Filtro e busca aplicados vão pra URL (sem empilhar histórico a cada tecla), pra o link e o
        // "voltar" do navegador reabrirem a tela no mesmo recorte.
        effect(() => {
            const queryParams = this.filtersToQueryParams();
            const current = this.route.snapshot.queryParamMap;
            if ((current.get('status') ?? null) === queryParams.status && (current.get('q') ?? null) === queryParams.q) return;
            this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
        });

        // O relógio do "atualizado há X" só roda no navegador (o prerender do servidor não pode ficar preso num intervalo).
        afterNextRender(() => {
            const timer = setInterval(() => this.now.set(Date.now()), 60_000);
            this.destroyRef.onDestroy(() => clearInterval(timer));
        });
    }

    /** Aplica o filtro e a busca da URL (voltar/avançar do navegador e links) e carrega os tickets do usuário logado. */
    ngOnInit(): void {
        this.applyQueryParams(this.route.snapshot.queryParamMap);
        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => this.applyQueryParams(params));
        this.store.loadForCurrentUser();
    }

    /** Lê `?status=` (finished/all; ausente ou inválido = Em aberto) e `?q=` e aplica no Store e no campo de busca. */
    private applyQueryParams(params: ParamMap): void {
        const status = params.get('status');
        const statusGroup = status === 'finished' || status === 'all' ? TICKET_STATUS_GROUP_URL_VALUES[status] : TicketStatusGroup.Active;
        const search = params.get('q') ?? '';
        this.store.setStatusGroup(statusGroup);
        this.store.setSearch(search);
        if (this.searchInput().trim() !== search.trim()) this.searchInput.set(search);
    }

    /** Filtro atual em query params — o padrão (Em aberto, sem busca) não aparece na URL. */
    private filtersToQueryParams(): { status: string | null; q: string | null } {
        const option = this.statusGroupOptions.find(o => o.value === this.store.statusGroup());
        return {
            status: option && option.key !== 'active' ? option.key : null,
            q: this.store.search() || null
        };
    }

    /** Troca o grupo de status pelo seletor. */
    onStatusGroupChange(statusGroup: TicketStatusGroup | null): void {
        this.store.setStatusGroup(statusGroup);
    }

    /** Volta ao padrão: Em aberto, sem busca (inclusive o texto ainda no debounce). */
    onClearFilters(): void {
        this.searchInput.set('');
        this.store.setSearch('');
        this.store.setStatusGroup(TicketStatusGroup.Active);
    }

    /** "atualizado há X" da linha, relativo à hora atual do navegador. */
    lastActivityLabel(ticket: Ticket): string {
        return formatLastActivity(ticket.lastActivityAtUtc, this.now());
    }

    /** Data e hora completas da última atividade, pro leitor de tela e o tooltip. */
    lastActivityFull(ticket: Ticket): string {
        return FULL_DATE_FORMAT.format(new Date(ticket.lastActivityAtUtc));
    }

    /** Troca a quantidade de itens por página, voltando para a primeira. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Só faz sentido reabrir um ticket que já está inativo (Resolvido/Fechado/Cancelado). */
    canReopen(ticket: Ticket): boolean {
        return ticket.status === TicketStatus.Resolved
            || ticket.status === TicketStatus.Closed
            || ticket.status === TicketStatus.Canceled;
    }

    /** Só um ticket ativo (Aberto/Em Andamento) pode ter a descrição editada ou ser cancelado. */
    isActive(ticket: Ticket): boolean {
        return TICKET_ACTIVE_STATUSES.has(ticket.status);
    }

    /** Indica se o ticket tem uma edição, cancelamento, reabertura ou exclusão em andamento — trava os botões da linha. */
    isPending(ticket: Ticket): boolean {
        return this.store.pendingTicketIds().includes(ticket.id);
    }

    /**
     * Devolve o foco ao "⋮" da linha do ticket depois da próxima renderização. O item clicado no menu
     * some ao fechar o dropdown (e a confirmação abre por código, sem devolver o foco), então sem isso
     * o foco cairia no `<body>` e o teclado/leitor de tela voltaria ao topo da página.
     */
    private focusRowActions(ticketId: string): void {
        afterNextRender(() => {
            const toggle = this.host.nativeElement.querySelector<HTMLElement>(`[data-row-actions="${ticketId}"]`);
            if (toggle) toggle.focus();
            else this.pageHeader()?.focus();
        }, { injector: this.injector });
    }

    /** Abre o modal de reabertura (com motivo opcional) para o ticket selecionado, sem herdar o erro de uma ação anterior. */
    onStartReopen(ticket: Ticket): void {
        this.store.clearMutationError();
        this.reopeningTicket.set(ticket);
    }

    /** Reabre o ticket do modal, publicando o motivo (se houver) como mensagem no chamado. */
    onReopenConfirm(reason: string | null): void {
        const ticket = this.reopeningTicket();
        if (!ticket) return;

        this.store.reopen(ticket.id, reason, () => {
            this.toastService.show('Chamado reaberto.');
            this.onReopenClosed();
        });
    }

    /** Fecha o modal de reabertura, devolvendo o foco ao "⋮" da linha. */
    onReopenClosed(): void {
        const ticket = this.reopeningTicket();
        this.reopeningTicket.set(null);
        if (ticket) this.focusRowActions(ticket.id);
    }

    /** Abre o modal de edição da descrição para o ticket selecionado, sem herdar o erro de uma ação anterior. */
    onStartEdit(ticket: Ticket): void {
        this.store.clearMutationError();
        this.editingTicket.set(ticket);
    }

    /** Fecha o modal de edição sem salvar, devolvendo o foco ao "⋮" da linha. */
    onEditClosed(): void {
        const ticket = this.editingTicket();
        this.editingTicket.set(null);
        if (ticket) this.focusRowActions(ticket.id);
    }

    /** Salva a descrição editada no modal, mantendo o status atual do ticket. */
    onEditSave(description: string): void {
        const ticket = this.editingTicket();
        if (!ticket) return;

        this.store.update(ticket.id, { description, status: ticket.status }, () => {
            this.toastService.show('Descrição atualizada.');
            this.onEditClosed();
        });
    }

    /** Confirma e cancela o ticket selecionado, preservando a descrição atual. */
    onCancelTicket(ticket: Ticket): void {
        this.confirmDialogService.confirm({
            title: `Cancelar o chamado "${ticket.title}"?`,
            message: 'O chamado passa para Cancelado e o setor deixa de atendê-lo. O histórico continua disponível e dá pra reabrir depois.',
            confirmLabel: 'Cancelar chamado',
            // "Cancelar" ao lado de "Cancelar ticket" deixava ambíguo qual botão desiste da ação.
            cancelLabel: 'Voltar',
            variant: 'danger'
        }).subscribe(confirmed => {
            this.focusRowActions(ticket.id);
            if (!confirmed) return;

            this.store.update(ticket.id, { description: ticket.description, status: TicketStatus.Canceled }, () => {
                this.toastService.show('Chamado cancelado.');
            });
        });
    }
}
