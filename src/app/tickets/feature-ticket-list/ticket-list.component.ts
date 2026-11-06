import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, ElementRef, Injector, DestroyRef, afterNextRender, viewChild } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { TicketsStore } from '../application/tickets.store';
import { MyTicketsSummaryStore } from '../application/my-tickets-summary.store';
import { currentTicketDue } from './ticket-list-due';
import { Ticket } from '../entities/ticket';
import { TicketStatus, TICKET_ACTIVE_STATUSES, TICKET_STATUS_LABELS } from '../entities/ticket-status';
import { TicketStatusGroup, TICKET_STATUS_GROUP_URL_VALUES } from '../entities/ticket-status-group';
import { TICKET_STATUS_BADGE_CLASS } from '../ui/ticket-badge-classes';
import { ConfirmDialogService, SEARCH_DEBOUNCE_MS, SessionService, ToastService, syncQueryParamsToUrl } from '../../shared';
import { TICKETS_CANCEL_PERMISSION, isCancelAvailable, ownerCancelHint } from '../application/ticket-cancel-window';
import { canEditTicketDescription, canReopenTicket } from '../application/ticket-action-permissions';
import { DepartmentsStore } from '../../departments';
import { TicketEditDialogComponent } from '../ui/ticket-edit-dialog/ticket-edit-dialog.component';
import { TicketReopenDialogComponent } from '../ui/ticket-reopen-dialog/ticket-reopen-dialog.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { FilterBarComponent } from '../../shared/ui/filter-bar/filter-bar.component';
import { TicketListGuideComponent } from './ticket-list-guide.component';
import { TicketListFirstUseComponent } from './ticket-list-first-use.component';
import { TicketListDueCellComponent } from './ticket-list-due-cell.component';

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
  imports: [CommonModule, RouterLink, PageHeaderComponent, TicketEditDialogComponent, TicketReopenDialogComponent, PaginationComponent, LoadingStateComponent, EmptyStateComponent, FilterBarComponent, TicketListGuideComponent, TicketListFirstUseComponent, TicketListDueCellComponent],
  templateUrl: './ticket-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
  /** Store de "Meus Chamados": listagem, filtro, busca e as ações da linha. */
  protected readonly store = inject(TicketsStore);
  /** Contagens por grupo pro seletor (GET /tickets/mine/summary, o mesmo resumo do Início). */
  protected readonly summaryStore = inject(MyTicketsSummaryStore);
  /** Diálogo de confirmação do sistema, usado antes de cancelar. */
  private readonly confirmDialogService = inject(ConfirmDialogService);
  /** Toasts de confirmação das ações da linha. */
  private readonly toastService = inject(ToastService);
  /** Sessão atual, pras permissões de abrir, cancelar, editar e reabrir. */
  private readonly sessionService = inject(SessionService);

  /** Pode abrir chamados (`tickets:create`): decide os atalhos para "Novo Chamado". */
  protected readonly canCreateTickets = computed(() => this.sessionService.hasPermission('tickets:create'));
  /** Departamentos e setores, pros que atendem no estado vazio de primeiro uso. */
  private readonly departmentsStore = inject(DepartmentsStore);
  /** Elemento da tela, onde se procuram as ações da linha pra devolver o foco. */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Injector dos `afterNextRender` e `toObservable` chamados fora do contexto de injeção. */
  private readonly injector = inject(Injector);
  /** Rota atual, de onde vêm o filtro e a busca (`?status=` e `?q=`). */
  private readonly route = inject(ActivatedRoute);
  /** Encerra o relógio e a escuta da URL quando a tela sai. */
  private readonly destroyRef = inject(DestroyRef);
  /** Cabeçalho da tela — recebe o foco quando a linha de origem não existe mais. */
  private readonly pageHeader = viewChild(PageHeaderComponent);

  /** Rótulo de cada status. */
  readonly statusLabels = TICKET_STATUS_LABELS;
  /** Classe de badge de cada status. */
  readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
  /** Prazo, situação e exibição do ciclo vigente de cada chamado (o novo, depois de reabrir). */
  readonly currentDue = currentTicketDue;

  /** Opções do seletor de grupo, na ordem da tela; "Em aberto" é o padrão. */
  readonly statusGroupOptions: { key: keyof typeof TICKET_STATUS_GROUP_URL_VALUES; label: string; value: TicketStatusGroup | null }[] = [
    { key: 'active', label: 'Em aberto', value: TicketStatusGroup.Active },
    { key: 'finished', label: 'Encerrados', value: TicketStatusGroup.Finished },
    { key: 'all', label: 'Todos', value: null }
  ];

  /** Enum exposto ao template, pras saídas dos estados vazios ("Ver encerrados", "Ver em aberto"). */
  readonly statusGroup = TicketStatusGroup;

  /**
   * Se a pessoa tem algum chamado, filtrado ou não: `true` com a lista não vazia; com a lista filtrada
   * vazia, o total do resumo (GET /tickets/mine/summary), sem outra requisição; `null` enquanto não dá pra saber.
   */
  readonly hasAnyTicket = computed((): boolean | null => {
    const page = this.store.ticketsPage();
    if (!page) return null;
    if (page.totalCount > 0) return true;
    if (this.store.statusGroup() === null && this.store.search().trim() === '') return false;
    // Resumo em erro: assume que há chamados, pra mostrar o vazio do filtro (que tem saída) em vez de carregar pra sempre.
    if (this.summaryStore.failed()) return true;
    const total = this.summaryStore.totalCount();
    return total === null ? null : total > 0;
  });

  /**
   * Mostra "Carregando…" na primeira carga e enquanto o resumo decide entre primeiro uso e
   * "nada pendente" — sem isso, o estado vazio errado piscava antes do certo.
   */
  readonly isLoadingList = computed(() => {
    if (this.store.tickets().length > 0 || this.store.loadError()) return false;
    return this.store.state().loading || this.hasAnyTicket() === null;
  });

  /** Recarga com linhas já na tela (troca de página, depois de uma ação): esmaece a tabela e marca `aria-busy`. */
  readonly isRefreshing = computed(() => this.store.state().loading && this.store.tickets().length > 0);

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

  /** Liga a busca com debounce, o filtro à URL e o relógio do "atualizado há X". */
  constructor() {
    // Busca com debounce, como no Monitor: só pergunta à API quando a pessoa para de digitar.
    toObservable(this.searchInput).pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(search => this.store.setSearch(search));

    // Filtro e busca aplicados vão pra URL (sem empilhar histórico a cada tecla e só quando mudam), pra o
    // link e o "voltar" do navegador reabrirem a tela no mesmo recorte.
    syncQueryParamsToUrl(() => this.filtersToQueryParams());

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
    // O resumo é root (o Início também usa): recarrega ao abrir pra contagem do seletor não ficar velha
    // depois de abrir um chamado em outra tela.
    this.summaryStore.reload();
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

  /** Quantos chamados há no grupo do seletor, ou null enquanto o resumo não chegou (o número só aparece quando há). */
  groupCount(key: 'active' | 'finished' | 'all'): number | null {
    if (key === 'active') return this.summaryStore.activeCount();
    if (key === 'finished') return this.summaryStore.finishedCount();
    return this.summaryStore.totalCount();
  }

  /** Nome do grupo atual em minúsculas, pra frase da busca vazia ("A busca vale só para em aberto."). */
  currentGroupLabel(): string {
    const option = this.statusGroupOptions.find(o => o.value === this.store.statusGroup());
    return (option?.label ?? 'Todos').toLowerCase();
  }

  /** Limpa só a busca, mantendo o grupo escolhido (inclusive o texto ainda no debounce). */
  onClearSearch(): void {
    this.searchInput.set('');
    this.store.setSearch('');
  }

  /**
   * Depois de cancelar/reabrir, a linha pode sair do grupo filtrado ("Em aberto" → "Encerrados").
   * Espera a lista recarregar e devolve o foco às ações da linha — ou, se ela saiu, ao título da tela,
   * em vez de deixá-lo cair no `<body>`. Também atualiza as contagens do seletor.
   */
  private afterRowMutation(ticketId: string): void {
    this.summaryStore.reload();
    toObservable(this.store.state, { injector: this.injector }).pipe(
      filter(state => !state.loading),
      take(1)
    ).subscribe(() => this.focusRowActions(ticketId));
  }

  /** Volta ao padrão: Em aberto, sem busca (inclusive o texto ainda no debounce). */
  onClearFilters(): void {
    this.searchInput.set('');
    this.store.setSearch('');
    this.store.setStatusGroup(TicketStatusGroup.Active);
  }

  /** Se quem está logado cancela qualquer chamado, sem prazo (`tickets:cancel`). */
  private canCancelAny(): boolean {
    return this.sessionService.hasPermission(TICKETS_CANCEL_PERMISSION);
  }

  /** Se o "Cancelar" aparece na linha: o back-end permite e, pro dono, a janela de 15 min ainda não venceu. */
  canCancel(ticket: Ticket): boolean {
    return this.isActive(ticket) && isCancelAvailable(ticket, this.now(), this.canCancelAny());
  }

  /** Tempo restante pro dono cancelar ("por mais 8 min"), ou null pra quem cancela sem prazo. */
  cancelHint(ticket: Ticket): string | null {
    return ownerCancelHint(ticket, this.now(), this.canCancelAny());
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

  /**
   * "Reabrir" na linha: chamado inativo e permissão de reabrir. A lista só traz chamados abertos por
   * quem está logado, então a pessoa é sempre a dona e precisa de `tickets:reopen-own` (`tickets:manage` não vale).
   */
  canReopen(ticket: Ticket): boolean {
    return canReopenTicket(ticket.status, true, code => this.sessionService.hasPermission(code));
  }

  /** "Editar" na linha: chamado ativo e dona com `tickets:update-own` (ou `tickets:manage`). */
  canEdit(ticket: Ticket): boolean {
    return canEditTicketDescription(ticket.status, true, code => this.sessionService.hasPermission(code));
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
   * Devolve o foco à primeira ação habilitada da linha do ticket depois da próxima renderização. O
   * botão clicado pode sumir (Cancelar vira Reabrir) e a confirmação abre por código, sem devolver o
   * foco, então sem isso o foco cairia no `<body>` e o teclado/leitor de tela voltaria ao topo.
   */
  private focusRowActions(ticketId: string): void {
    afterNextRender(() => {
      const toggle = this.host.nativeElement.querySelector<HTMLElement>(`[data-row-actions="${ticketId}"] button:not([disabled])`);
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

    const leavesGroup = this.store.statusGroup() === TicketStatusGroup.Finished;
    this.store.reopen(ticket.id, reason, () => {
      this.toastService.show(leavesGroup ? 'Chamado reaberto — agora está em Em aberto.' : 'Chamado reaberto.');
      this.reopeningTicket.set(null);
      this.afterRowMutation(ticket.id);
    });
  }

  /** Fecha o modal de reabertura, devolvendo o foco às ações da linha. */
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

  /** Fecha o modal de edição sem salvar, devolvendo o foco às ações da linha. */
  onEditClosed(): void {
    const ticket = this.editingTicket();
    this.editingTicket.set(null);
    if (ticket) this.focusRowActions(ticket.id);
  }

  /** Salva a descrição editada no modal; o status vai como está no chamado relido pelo Store. */
  onEditSave(description: string): void {
    const ticket = this.editingTicket();
    if (!ticket) return;

    this.store.update(ticket.id, { description }, () => {
      this.toastService.show('Descrição atualizada.');
      this.onEditClosed();
    });
  }

  /** Confirma e cancela o ticket selecionado; a descrição vai como está no chamado relido pelo Store. */
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

      const leavesGroup = this.store.statusGroup() === TicketStatusGroup.Active;
      this.store.update(ticket.id, { status: TicketStatus.Canceled }, () => {
        this.toastService.show(leavesGroup ? 'Chamado cancelado — agora está em Encerrados.' : 'Chamado cancelado.');
        this.afterRowMutation(ticket.id);
      });
    });
  }
}
