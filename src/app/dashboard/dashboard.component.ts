import { Component, inject, Injector, OnInit, OnDestroy, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, signal, computed, effect, viewChild, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Chart as ChartInstance } from 'chart.js';
import { MyTicketsSummaryStore, TicketSummaryStore, TicketDashboardStore, TicketDashboardScope, TicketMonitorItem, TicketVolumeGrouping, TicketStatus, TicketSlaStatus, TicketPriority, TICKET_VOLUME_GROUPING_LABELS, TICKET_VOLUME_GROUPING_OPTIONS } from '../tickets';
import { DepartmentsStore } from '../departments';
import { DashboardFiltersService } from './dashboard-filters.service';
import { toMonitorQueryParams } from './dashboard-filters';
import { DashboardFilterBarComponent } from './dashboard-filter-bar.component';
import { DashboardMetric, DashboardMetricGroupComponent } from './dashboard-metric-group.component';
import { SessionService, ToastService, loadChart } from '../shared';
import { DashboardGuideComponent } from './dashboard-guide.component';
import { DashboardInsightsComponent } from './dashboard-insights.component';
import { PageHeaderComponent } from '../shared/ui/page-header/page-header.component';
import { StatCardComponent, StatTone } from '../shared/ui/stat-card/stat-card.component';
import { EmptyStateComponent } from '../shared/ui/data-state/data-state.components';
// O shell pode ligar peças de um domínio direto (como faz com as telas feature-*): o diálogo depende de
// UserSummary (domínio users), por isso mora em tickets/ui e não em shared/ui.
import { TicketAssignDialogComponent } from '../tickets/ui/ticket-assign-dialog/ticket-assign-dialog.component';

/**
 * Paleta categórica (5 slots, validada com scripts/validate_palette.js do skill dataviz — PASS em
 * todos os checks de banda de luminosidade, piso de croma e separação CVD) — pedido explícito do
 * usuário em 2026-10-24 pra trazer de volta o colorido por barra (uma tentativa anterior de
 * "resolver" isso com um gradiente dentro do índigo, pra respeitar a One Accent Rule do
 * DESIGN.md, foi rejeitada: o usuário quer as cores de volta mesmo, laranja incluso). Reaproveitada
 * aqui puramente como ritmo visual entre as barras do volume por período — a cor não carrega
 * significado por status neste gráfico, é uma exceção deliberada à One Accent Rule.
 */
const CATEGORICAL_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];

/**
 * Saudação pela hora do dia (0–23) — "Bom dia"/"Boa tarde"/"Boa noite" é o que se diz em pt-BR ao
 * começar o trabalho, mais natural que o "Seja bem-vindo(a)" de formulário. Madrugada é "Boa noite".
 */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Quantos períodos o back-end devolve por agrupamento (GetTicketVolumeQueryHandler) — usado só sem dados. */
const VOLUME_DEFAULT_POINTS: Record<TicketVolumeGrouping, number> = { Day: 30, Week: 12, Month: 12 };

/** Nomes curtos dos meses em português, para rotular o gráfico quando o agrupamento é mensal. */
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Tela de dashboard: visão dos tickets de toda a empresa (não filtrada por quem está logado) —
 * todo papel vê os mesmos números, inclusive Administrador, para dar noção de volume de chamados
 * abertos por dia/semana/mês. Carregada ao abrir a tela, sem atualização automática: cada reload
 * dos `resource()` troca os números por spinner, então um polling faria os cards piscarem — por
 * isso a tela não promete "ao vivo". Vive no shell (fora de qualquer domínio) porque é a tela
 * que cruza dados de mais de um domínio — hoje só tickets, mas é aqui que uma futura métrica de
 * outro domínio entraria, não dentro do domínio de tickets.
 */
@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, PageHeaderComponent, DashboardGuideComponent, DashboardInsightsComponent, EmptyStateComponent, StatCardComponent, TicketAssignDialogComponent, DashboardFilterBarComponent, DashboardMetricGroupComponent],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardFiltersService],
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly store = inject(TicketSummaryStore);
  /** Resumo dos chamados que o próprio usuário abriu (bloco "Seus chamados"). */
  protected readonly myTickets = inject(MyTicketsSummaryStore);
  protected readonly sessionService = inject(SessionService);
  /** Widgets operacionais (Volume, SLA, Central de atenção) pra quem atende a fila. */
  protected readonly operation = inject(TicketDashboardStore);
  /** Filtros dos widgets operacionais, com a URL como fonte da verdade. */
  protected readonly filters = inject(DashboardFiltersService);
  /** Departamentos e setores pra opção de setor do filtro (GET /departments, só os ativos). */
  protected readonly departmentsStore = inject(DepartmentsStore);

  /** Mostra os widgets operacionais filtráveis: só pra quem atende a fila (a API exige `tickets:manage`). */
  protected readonly showOperation = computed(() => this.sessionService.hasPermission('tickets:manage'));

  /** Volume do recorte; cada card leva ao Monitor com o mesmo recorte e o status do card. */
  protected readonly volumeMetrics = computed((): DashboardMetric[] => {
    const scope = this.filters.filters();
    const volume = this.operation.volume();
    return [
      { key: 'total', label: 'Total', icon: 'bx-receipt', tone: 'primary', value: volume?.total ?? null, ariaNoun: 'chamados no total', hint: 'Todos os status', queryParams: toMonitorQueryParams(scope) },
      { key: 'backlog', label: 'Backlog', icon: 'bx-error-circle', tone: 'warning', value: volume?.backlog ?? null, ariaNoun: 'chamados no backlog', hint: 'Aberto ou em andamento', queryParams: toMonitorQueryParams(scope, { status: 'active' }) },
      { key: 'inProgress', label: 'Em andamento', icon: 'bx-time-five', tone: 'info', value: volume?.inProgress ?? null, ariaNoun: 'chamados em andamento', queryParams: toMonitorQueryParams(scope, { status: TicketStatus.InProgress }) },
      { key: 'resolved', label: 'Resolvidos', icon: 'bx-check-double', tone: 'success', value: volume?.resolved ?? null, ariaNoun: 'chamados resolvidos', queryParams: toMonitorQueryParams(scope, { status: TicketStatus.Resolved }) },
      { key: 'closed', label: 'Fechados', icon: 'bx-lock-alt', tone: 'primary', value: volume?.closed ?? null, ariaNoun: 'chamados fechados', queryParams: toMonitorQueryParams(scope, { status: TicketStatus.Closed }) }
    ];
  });

  /** SLA do recorte, do mais grave ao cumprido. */
  protected readonly slaMetrics = computed((): DashboardMetric[] => {
    const scope = this.filters.filters();
    const sla = this.operation.sla();
    return [
      { key: 'breached', label: 'Atrasados', icon: 'bx-error', tone: 'danger', value: sla?.breached ?? null, ariaNoun: 'chamados com o prazo vencido', hint: 'Prazo vencido, ainda ativos', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Breached }) },
      { key: 'atRisk', label: 'Vencem em breve', icon: 'bx-time', tone: 'warning', value: sla?.atRisk ?? null, ariaNoun: 'chamados perto de vencer', hint: 'Já usaram 75% do prazo', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.AtRisk }) },
      { key: 'met', label: 'Cumpridos', icon: 'bx-check-circle', tone: 'success', value: sla?.met ?? null, ariaNoun: 'chamados resolvidos no prazo', hint: 'Resolvidos no prazo, desde o início', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Met }) }
    ];
  });

  /** Central de atenção, em ordem de gravidade: atrasados, críticos e sem responsável. */
  protected readonly attentionMetrics = computed((): DashboardMetric[] => {
    const scope = this.filters.filters();
    const attention = this.operation.attention();
    return [
      { key: 'overdue', label: 'Atrasados', icon: 'bx-error', tone: 'danger', value: attention?.overdue ?? null, ariaNoun: 'chamados atrasados', hint: 'Prazo vencido', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Breached }) },
      { key: 'critical', label: 'Críticos', icon: 'bx-error-alt', tone: 'danger', value: attention?.critical ?? null, ariaNoun: 'chamados urgentes ativos', hint: 'Urgentes, ainda ativos', queryParams: toMonitorQueryParams(scope, { priority: TicketPriority.Urgent, status: 'active' }) },
      { key: 'unassigned', label: 'Sem responsável', icon: 'bx-user-x', tone: 'warning', value: attention?.unassigned ?? null, ariaNoun: 'chamados ativos sem responsável', hint: 'Ativos, ninguém assumiu', queryParams: toMonitorQueryParams(scope, { unassignedOnly: 'true', status: 'active' }) }
    ];
  });

  /** Troca de um filtro na barra (grava na URL; os widgets seguem a URL). */
  protected onFilterChange(partial: Partial<TicketDashboardScope>): void {
    this.filters.update(partial);
  }
  private readonly toastService = inject(ToastService);

  /** Chamado do alerta de SLA que está recebendo um responsável (diálogo "Atribuir" aberto), ou null. */
  protected readonly assigningTicket = signal<TicketMonitorItem | null>(null);

  /**
   * Configuração dos 3 cards de status clicáveis (Aberto/Andamento/Resolvido) — mesma estrutura
   * visual pros três, só variando dado/cor/ícone/rótulo; o card "Total de Chamados" fica fora
   * (estrutura diferente: legenda de breakdown em vez de dica de permissão, sem link). Extraído
   * de 3 blocos de HTML copiados no simplify de 2026-10-27.
   */
  protected readonly statusCards = computed(() => [
    {
      status: TicketStatus.Open,
      label: 'Em Aberto',
      tone: 'warning' as StatTone,
      icon: 'bx-error-circle',
      value: this.store.openCount(),
      ariaNoun: 'em aberto'
    },
    {
      status: TicketStatus.InProgress,
      label: 'Em Andamento',
      tone: 'info' as StatTone,
      icon: 'bx-time-five',
      value: this.store.inProgressCount(),
      ariaNoun: 'em andamento'
    },
    {
      status: TicketStatus.Resolved,
      label: 'Resolvidos',
      tone: 'success' as StatTone,
      icon: 'bx-check-double',
      value: this.store.resolvedCount(),
      ariaNoun: 'resolvidos'
    }
  ]);

  /**
   * Indica papel administrativo (hoje só Administrador — Atendente tem `tickets:manage`, mas
   * nenhuma permissão de usuários/roles/estrutura, conforme SYSTEM_SPECIFICATION.md do back-end).
   * Administrador não abre nem atende chamados operacionalmente (PRODUCT.md), então "Novo
   * Ticket"/"Meus Tickets" em Ações Rápidas não se aplicam a esse papel — só a `tickets:manage`
   * sozinho não bastaria, porque o Atendente também tem essa permissão e, pra ele, os dois atalhos
   * continuam fazendo sentido.
   */
  /** Mostra "Seus chamados": pra quem abre chamados e não atende a fila (quem atende tem os atalhos da fila). */
  protected readonly showMyTickets = computed(() =>
      this.sessionService.hasPermission('tickets:view-own') && !this.sessionService.hasPermission('tickets:manage'));

  /**
   * Os 3 cards de "Seus chamados", com as contagens do próprio usuário. Cada um abre Meus Chamados
   * no grupo correspondente: "Em aberto" (Aberto + Em Andamento) é o padrão da tela; "Resolvidos"
   * abre "Encerrados" (`?status=finished`), que também inclui fechados e cancelados.
   */
  protected readonly myTicketCards = computed(() => [
    { label: 'Em aberto', icon: 'bx-error-circle', tone: 'warning' as StatTone, value: this.myTickets.openCount(), ariaNoun: 'chamados seus em aberto', queryParams: {} },
    { label: 'Em andamento', icon: 'bx-time-five', tone: 'info' as StatTone, value: this.myTickets.inProgressCount(), ariaNoun: 'chamados seus em andamento', queryParams: {} },
    { label: 'Resolvidos', icon: 'bx-check-double', tone: 'success' as StatTone, value: this.myTickets.resolvedCount(), ariaNoun: 'chamados seus resolvidos', queryParams: { status: 'finished' } }
  ]);

  protected readonly isAdministrative = computed(() =>
      this.sessionService.hasPermission('users:read') ||
      this.sessionService.hasPermission('roles:manage') ||
      this.sessionService.hasPermission('departments:manage') ||
      this.sessionService.hasPermission('sectors:manage'));

  /**
   * Saudação pela hora local de quem está usando (ver {@link greetingForHour}) — calculada uma vez
   * por visita à tela (não precisa virar de "tarde" pra "noite" ao vivo).
   */
  protected readonly greeting = greetingForHour(new Date().getHours());

  /**
   * Primeiro uso: os totais chegaram (sem carregar, sem erro) e a empresa não tem nenhum ticket —
   * o gráfico vazio vira um convite com a próxima ação, em vez de só "nenhum chamado".
   */
  protected readonly isFirstUse = computed(() =>
      !this.store.statusCountsLoading() && !this.store.statusCountsFailed() && this.store.total() === 0);

  /** Quem pode cadastrar a estrutura (departamentos/setores) — no primeiro uso, é o passo que vem antes de qualquer ticket. */
  protected readonly canSetUpStructure = computed(() =>
      this.sessionService.hasPermission('departments:manage') || this.sessionService.hasPermission('sectors:manage'));

  /** Query de view como signal (Angular 17.3+) — substitui @ViewChild, sem `!` nem ngAfterViewInit. */
  private readonly volumeChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('volumeChart');

  /** Tabela acessível do volume — recebe o foco quando o usuário troca o gráfico pela tabela. */
  private readonly volumeTable = viewChild<ElementRef<HTMLTableElement>>('volumeTable');

  /** Injector pro `afterNextRender` do foco na tabela (chamado fora do contexto de injeção). */
  private readonly injector = inject(Injector);

  private chart: ChartInstance | null = null;

  /**
   * Identificador do redesenho mais recente pedido. `renderChart` é assíncrono (`await
   * loadChart()`); se o efeito disparar de novo antes do primeiro `await` terminar, as duas
   * chamadas ficam em voo ao mesmo tempo — sem isso, a que resolve por último vence, não a que foi
   * pedida por último, podendo sobrescrever o gráfico com dado desatualizado.
   */
  private renderToken = 0;

  /** Alterna a tabela acessível que espelha os dados do gráfico (relief rule para o WARN de contraste). */
  readonly showTable = signal(false);

  protected readonly groupByOptions = TICKET_VOLUME_GROUPING_OPTIONS;
  protected readonly groupByLabels = TICKET_VOLUME_GROUPING_LABELS;

  /**
   * Intervalo coberto pelo gráfico, pra dizer no título o que antes só dava pra deduzir pelos
   * rótulos do eixo — conta os pontos recebidos; sem dados, usa a janela padrão do back-end
   * (30 dias, 12 semanas, 12 meses).
   */
  protected readonly volumeRangeLabel = computed(() => {
      const groupBy = this.store.groupBy();
      const points = this.store.volume().length || VOLUME_DEFAULT_POINTS[groupBy];
      switch (groupBy) {
          case 'Week': return `Últimas ${points} semanas`;
          case 'Month': return `Últimos ${points} meses`;
          default: return `Últimos ${points} dias`;
      }
  });

  /** Rótulos formatados do período atual (um por ponto do volume), para o eixo do gráfico e a tabela acessível. */
  protected readonly periodLabels = computed(() => {
      const groupBy = this.store.groupBy();
      return this.store.volume().map(point => this.formatPeriodLabel(point.periodStart, groupBy));
  });

  constructor() {
    // Os widgets operacionais seguem os filtros da URL (trocar um filtro cancela as contagens em voo).
    effect(() => this.operation.setScope(this.filters.filters()));

    // Redesenha o gráfico sempre que o volume ou o agrupamento mudarem, ou o canvas for montado (@defer).
    effect(() => {
      const volume = this.store.volume();
      const canvasRef = this.volumeChartCanvas();

      if (isPlatformBrowser(this.platformId) && canvasRef) {
        void this.renderChart(canvasRef, volume.map(point => point.count), this.periodLabels());
      }
    });
  }

  /** Carrega os totais por status e o volume de tickets da empresa ao inicializar a tela. */
  ngOnInit() {
    this.store.load();
  }

  /** Libera o gráfico ao sair da tela — Chart.js não limpa sozinho ao desmontar o canvas. */
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /** Alterna entre exibir o gráfico e a tabela acessível equivalente. */
  toggleTable(): void {
    this.showTable.update(show => !show);
    // Ao abrir a tabela, o foco vai pra ela: o leitor de tela anuncia a legenda e quem usa teclado
    // já está nos dados, em vez de o conteúdo trocar em silêncio abaixo do botão.
    if (this.showTable()) {
      afterNextRender(() => this.volumeTable()?.nativeElement.focus(), { injector: this.injector });
    }
  }

  /** Abre o diálogo "Atribuir" pro chamado de um alerta de SLA sem responsável, com a busca limpa. */
  onAssign(ticket: TicketMonitorItem): void {
    this.store.resetAssignment();
    this.assigningTicket.set(ticket);
  }

  /** Confirma o responsável escolhido: atribui, avisa e fecha o diálogo (os alertas recarregam no store). */
  onConfirmAssign(choice: { userId: string; name: string }): void {
    const ticket = this.assigningTicket();
    if (!ticket) return;

    this.store.assignResponsible(ticket.id, choice.userId, () => {
      this.toastService.show(`${choice.name} agora é o responsável.`);
      this.assigningTicket.set(null);
    });
  }

  /** Fecha o diálogo "Atribuir" sem atribuir, limpando busca e erro pra próxima vez. */
  onAssignClosed(): void {
    this.assigningTicket.set(null);
    this.store.resetAssignment();
  }

  /** Muda o agrupamento do gráfico de volume (dia/semana/mês). */
  setGroupBy(groupBy: TicketVolumeGrouping): void {
    this.store.setGroupBy(groupBy);
  }

  /**
   * Legenda do card "Total de Chamados" explicando por que ele não soma com os 3 cards visíveis
   * (Aberto/Andamento/Resolvido) — o Total inclui Fechados e Cancelados, que não têm card próprio.
   * Null quando não há nada a explicar (nenhum fechado/cancelado ainda).
   */
  protected totalBreakdownLabel(closedCount: number, canceledCount: number): string | null {
    if (closedCount === 0 && canceledCount === 0) {
      return null;
    }

    const parts: string[] = [];
    if (closedCount > 0) {
      parts.push(closedCount === 1 ? '1 fechado' : `${closedCount} fechados`);
    }
    if (canceledCount > 0) {
      parts.push(canceledCount === 1 ? '1 cancelado' : `${canceledCount} cancelados`);
    }
    return `Inclui ${parts.join(' e ')}`;
  }

  /**
   * Formata o início de um período (aaaa-mm-dd) para exibição — dd/mm para dia e semana (o início
   * da semana já vem como a segunda-feira), "mês/ano" abreviado para mês.
   */
  protected formatPeriodLabel(periodStart: string, groupBy: TicketVolumeGrouping): string {
    const [year, month, day] = periodStart.split('-');
    if (groupBy === 'Month') {
      return `${MONTH_LABELS[Number(month) - 1]}/${year.slice(2)}`;
    }
    return `${day}/${month}`;
  }

  /**
   * Desenha (ou redesenha) o gráfico de barras do volume de tickets abertos por período.
   * Cores de texto/borda são lidas de `data-bs-theme` no momento do desenho — se o SO mudar de
   * tema enquanto o dashboard já está aberto, o gráfico só reflete isso no próximo redesenho
   * (novo volume ou reabertura da tela), não ao vivo.
   */
  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, counts: number[], labels: string[]) {
    const token = ++this.renderToken;
    const { Chart } = await loadChart();

    // Chegou um pedido de redesenho mais novo enquanto este esperava o Chart.js carregar —
    // descarta este (dado desatualizado) em vez de sobrescrever o gráfico já correto.
    if (token !== this.renderToken) return;

    const ctx = canvasRef.nativeElement.getContext('2d');
    // Lê o valor computado de verdade de --tk-surface/--tk-text-secondary em vez de duplicar o
    // hex como literal: o Chart.js não lê custom properties no config, mas o navegador já resolveu
    // a cascata (claro/escuro) pra esse elemento — ler daqui acompanha o token automaticamente se
    // ele mudar de valor no CSS, sem precisar lembrar de atualizar uma cópia aqui (achado no
    // simplify de 2026-10-27).
    const rootStyle = getComputedStyle(document.documentElement);
    const surfaceColor = rootStyle.getPropertyValue('--tk-surface').trim();
    const textColor = rootStyle.getPropertyValue('--tk-text-secondary').trim();

    this.chart?.destroy();

    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Chamados criados',
          data: counts,
          backgroundColor: counts.map((_, i) => CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]),
          borderColor: surfaceColor,
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Entrada curta (o padrão do Chart.js, ~1s, parece lentidão numa tela de operação) e
        // nenhuma com prefers-reduced-motion — os dados aparecem direto.
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? false
          : { duration: 300, easing: 'easeOutQuart' },
        color: textColor,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: textColor }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }
}
