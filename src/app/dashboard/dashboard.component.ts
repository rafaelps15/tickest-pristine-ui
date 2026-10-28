import { Component, inject, Injector, OnInit, ChangeDetectionStrategy, signal, computed, effect, linkedSignal, untracked, DestroyRef, DOCUMENT, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Params, RouterLink } from '@angular/router';
import { MyTicketsSummaryStore, TicketSummaryStore, TicketDashboardStore, TicketAssigneesStore, TicketAwaiting, TicketMonitorItem, TicketVolumePoint, TicketVolumeGrouping, TicketSlaStatus, TicketPriority, TicketStatusCounts, TicketDashboardChartScope } from '../tickets';
import { DepartmentsStore } from '../departments';
import { DashboardFiltersService } from './dashboard-filters.service';
import { DashboardFilters, dashboardFilterChips, resolveDashboardScope, toMonitorQueryParams, todayInSaoPaulo } from './dashboard-filters';
import { DashboardTimesComponent } from './dashboard-times.component';
import { DashboardFilterBarComponent } from './dashboard-filter-bar.component';
import { DashboardMetric, DashboardMetricGroupComponent, DashboardMetricLead } from './dashboard-metric-group.component';
import { DASHBOARD_FEATURES, SessionService, ToastService } from '../shared';
import { DashboardGuideComponent } from './dashboard-guide.component';
import { DashboardInsightsComponent } from './dashboard-insights.component';
import { DashboardHeroChartComponent } from './dashboard-hero-chart.component';
import { DashboardKpi, DashboardKpiStripComponent } from './dashboard-kpi-strip.component';
import { DashboardNoticeComponent } from './dashboard-notice.component';
import { DashboardLink } from './dashboard-status-composition.component';
import { DashboardStatusGroup, DASHBOARD_STATUS_GROUP_STATUS, accessNote, bucketRange, freshnessLabel, statusComposition, volumeInsight, widgetState } from './dashboard-overview';
import { DashboardAutoRefresh, startDashboardAutoRefresh } from './dashboard-auto-refresh';
import { PageHeaderComponent } from '../shared/ui/page-header/page-header.component';
import { StatCardComponent, StatTone } from '../shared/ui/stat-card/stat-card.component';
// O shell pode ligar peças de um domínio direto (como faz com as telas feature-*): o diálogo depende de
// UserSummary (domínio users), por isso mora em tickets/ui e não em shared/ui.
import { TicketAssignDialogComponent } from '../tickets/ui/ticket-assign-dialog/ticket-assign-dialog.component';

/** De quanto em quanto tempo o "Atualizado há N min" do cabeçalho anda. */
const FRESHNESS_TICK_MS = 30_000;

/**
 * Comparação de uma contagem com a do período anterior, em texto ("12 a mais que no período
 * anterior"); null quando não há período anterior pra comparar.
 */
export function countTrend(current: number | undefined, previous: number | undefined): string | null {
  if (current === undefined || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return 'igual ao período anterior';
  return `${Math.abs(diff)} a ${diff > 0 ? 'mais' : 'menos'} que no período anterior`;
}

/** Taxa de SLA cumprido entre os resolvidos (cumpridos ÷ cumpridos + com atraso), em %, ou null sem resolvidos. */
export function slaRate(met: number, missed: number): number | null {
  const resolved = met + missed;
  return resolved > 0 ? Math.round((met * 100) / resolved) : null;
}

/**
 * Saudação pela hora do dia (0–23) — "Bom dia"/"Boa tarde"/"Boa noite" é o que se diz em pt-BR ao
 * começar o trabalho, mais natural que o "Seja bem-vindo(a)" de formulário. Madrugada é "Boa noite".
 */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Tela de Início: como a operação de chamados da empresa inteira está andando, pra qualquer
 * colaborador (decisão do produto). Hierarquia, de cima pra baixo: cabeçalho (saudação, idade dos
 * números, guia), faixa de indicadores, gráfico principal (composição atual e fluxo por período) e,
 * abaixo da dobra, o que pede ação (Central de atenção e Alertas de SLA) e o restante. Os números
 * agregados são da empresa; o drill-down abre a lista que a pessoa pode ver, com os filtros da URL.
 * Atualiza sozinha a cada 2 minutos com a aba visível. Vive no shell porque cruza domínios.
 */
@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, PageHeaderComponent, DashboardGuideComponent, DashboardInsightsComponent, StatCardComponent, TicketAssignDialogComponent, DashboardFilterBarComponent, DashboardMetricGroupComponent, DashboardTimesComponent, DashboardHeroChartComponent, DashboardKpiStripComponent, DashboardNoticeComponent],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardFiltersService],
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  /** Números da empresa (totais e volume), Alertas de SLA e o diálogo "Atribuir". */
  protected readonly store = inject(TicketSummaryStore);
  /** Usuário logado e permissões (já carregados: o guard de autenticação espera o GET /users/me). */
  protected readonly sessionService = inject(SessionService);
  /**
   * Resumo dos chamados que o próprio usuário abriu ("Seus chamados" e o aviso "Você tem acesso a X
   * dos Y") — só criado pra quem não atende a fila: o store busca sozinho ao nascer, e o atendente não
   * usa esses números aqui (o pedido seria à toa). Null pra quem atende a fila.
   */
  protected readonly myTickets = this.sessionService.hasPermission('tickets:manage') ? null : inject(Injector).get(MyTicketsSummaryStore);
  /** Widgets operacionais (agregado, tempos, volume do recorte) pra quem atende a fila. */
  protected readonly operation = inject(TicketDashboardStore);
  /** Filtros com a URL como fonte da verdade. */
  protected readonly filters = inject(DashboardFiltersService);
  /** Departamentos e setores pra opção de setor do filtro (GET /departments, só os ativos). */
  protected readonly departmentsStore = inject(DepartmentsStore);
  /** Responsáveis elegíveis pro filtro de responsável (GET /tickets/assignees). */
  protected readonly assigneesStore = inject(TicketAssigneesStore);
  /** Funcionalidades que dependem de endpoints novos do back-end. */
  protected readonly features = inject(DASHBOARD_FEATURES);
  /** Aviso de sucesso do "Atribuir". */
  private readonly toastService = inject(ToastService);
  /** Encerra o relógio e a atualização automática ao sair da tela. */
  private readonly destroyRef = inject(DestroyRef);
  /** Documento, pra saber se a aba está visível. */
  private readonly document = inject(DOCUMENT);
  /** Plataforma: relógio e atualização automática só no navegador (não no SSR). */
  private readonly platformId = inject(PLATFORM_ID);
  /** Atualização automática ligada (null no SSR). */
  private autoRefresh: DashboardAutoRefresh | null = null;
  /** A recarga em curso veio de uma atualização (automática ou do botão): ao terminar, avisa o leitor de tela. */
  private announceNext = false;

  /** Hoje no horário de Brasília — base dos períodos prontos ("Últimos 30 dias"), calculado por visita à tela. */
  protected readonly today = todayInSaoPaulo();

  /**
   * Saudação pela hora local de quem está usando (ver {@link greetingForHour}) — calculada uma vez
   * por visita à tela (não precisa virar de "tarde" pra "noite" ao vivo).
   */
  protected readonly greeting = greetingForHour(new Date().getHours());

  /** Quem atende a fila (`tickets:manage`): vê filtros, Central de atenção e Alertas de SLA. */
  protected readonly showOperation = computed(() => this.sessionService.hasPermission('tickets:manage'));

  /** Mostra "Seus chamados": pra quem abre chamados e não atende a fila (quem atende tem os atalhos da fila). */
  protected readonly showMyTickets = computed(() =>
      this.sessionService.hasPermission('tickets:view-own') && !this.sessionService.hasPermission('tickets:manage'));

  /**
   * Indica papel administrativo (hoje só Administrador — Atendente tem `tickets:manage`, mas
   * nenhuma permissão de usuários/roles/estrutura). Administrador não abre nem atende chamados
   * operacionalmente, então "Novo Chamado"/"Meus Chamados" não se aplicam a esse papel.
   */
  protected readonly isAdministrative = computed(() =>
      this.sessionService.hasPermission('users:read') ||
      this.sessionService.hasPermission('roles:manage') ||
      this.sessionService.hasPermission('departments:manage') ||
      this.sessionService.hasPermission('sectors:manage'));

  /** Quem pode cadastrar a estrutura (departamentos/setores) — no primeiro uso, é o passo que vem antes de qualquer ticket. */
  protected readonly canSetUpStructure = computed(() =>
      this.sessionService.hasPermission('departments:manage') || this.sessionService.hasPermission('sectors:manage'));

  /**
   * Recorte dos filtros da URL em filtros da API (departamento → setores, período → datas); null
   * enquanto um departamento da URL espera a lista de departamentos. Vale pras listas do drill-down
   * e, no escopo "Com filtros", pros números.
   */
  protected readonly scope = computed(() => resolveDashboardScope(
    this.filters.filters(), this.departmentsStore.departments(), this.departmentsStore.listState().loading, this.today));

  /** O escopo "Com filtros" já tem back-end pros números: o agregado (spec 026). */
  protected readonly filteredAvailable = computed(() => this.showOperation() && this.features.operationOverview);

  /** O fluxo do gráfico também segue os filtros: precisa do volume do recorte (spec 028). */
  protected readonly flowFilteredAvailable = computed(() => this.filteredAvailable() && this.features.volumeResolved);

  /** Escopo efetivo dos números: "filtered" só com o back-end pronto e escolhido; senão a empresa toda. */
  protected readonly chartScope = computed((): TicketDashboardChartScope =>
      this.filteredAvailable() && this.operation.chartScope() === 'filtered' ? 'filtered' : 'company');

  /** Escopo do fluxo: o dos números, menos "Com filtros" enquanto o volume do recorte não existe (fica a empresa). */
  protected readonly flowScope = computed((): TicketDashboardChartScope =>
      this.chartScope() === 'filtered' && this.flowFilteredAvailable() ? 'filtered' : 'company');

  /** Filtros ativos em texto, pra linha "Filtros aplicados às listas" (escopo da empresa). */
  protected readonly filterChips = computed(() =>
      dashboardFilterChips(this.filters.filters(), this.departmentsStore.departments(), this.assigneesStore.assignees()));

  /** Os filtros ativos numa frase ("Últimos 30 dias, Prioridade: Alta"). */
  protected readonly filterChipLabels = computed(() => this.filterChips().map(chip => chip.label).join(', '));

  /** Se há período escolhido (muda os textos de apoio de SLA e tempos). */
  protected readonly hasPeriod = computed(() => this.chartScope() === 'filtered' && !!(this.scope()?.from || this.scope()?.to));

  // ── Números da empresa ou do recorte ──────────────────────────────────────────────────────────

  /** Totais por status do escopo, como a fonte responde agora (null carregando ou em erro). */
  private readonly liveCounts = computed((): TicketStatusCounts | null => {
    if (this.chartScope() === 'company') return this.store.statusCounts();
    const volume = this.operation.volume();
    return volume
      ? { totalCount: volume.totalCount, openCount: volume.openCount, inProgressCount: volume.inProgressCount, resolvedCount: volume.resolvedCount, closedCount: volume.closedCount, canceledCount: volume.canceledCount }
      : null;
  });

  /** A leitura dos totais falhou agora. */
  private readonly countsFailed = computed(() => this.chartScope() === 'company' ? this.store.statusCountsFailed() : !!this.operation.overviewError());

  /**
   * Totais exibidos: os de agora ou, se uma atualização falhou (rede caiu), os últimos bons do mesmo
   * escopo — a tela não troca números certos por um erro; o cabeçalho avisa que estão velhos.
   */
  private readonly counts = linkedSignal<{ scope: TicketDashboardChartScope; value: TicketStatusCounts | null }, TicketStatusCounts | null>({
    source: () => ({ scope: this.chartScope(), value: this.liveCounts() }),
    computation: (current, previous) => current.value ?? (previous && previous.source.scope === current.scope ? previous.value : null)
  });

  /** Mensagem do erro dos totais: a do servidor quando ele explica (ex.: sem permissão), senão a padrão. */
  protected readonly countsErrorText = computed(() =>
    (this.chartScope() === 'company' ? this.store.summaryError() : this.operation.overviewError()) ?? 'Não foi possível carregar os números.');

  /** Estado dos totais por status (indicadores e composição); com números antigos na tela, não é erro. */
  protected readonly countsState = computed(() => widgetState({
    available: this.chartScope() === 'company' ? this.store.companyStatsAvailable() : true,
    failed: this.countsFailed() && this.counts() === null,
    hasValue: this.counts() !== null
  }));

  /** Composição atual por status, pra barra do gráfico. */
  protected readonly composition = computed(() => {
    const counts = this.counts();
    return counts ? statusComposition(counts) : null;
  });

  /** Agrupamento do fluxo, do escopo. */
  protected readonly flowGroupBy = computed(() => this.flowScope() === 'company' ? this.store.groupBy() : this.operation.groupBy());

  /** Pontos do fluxo como a fonte responde agora (null carregando ou em erro). */
  private readonly livePoints = computed((): TicketVolumePoint[] | null => this.flowScope() === 'company'
    ? (this.store.volumeHasValue() ? this.store.volume() : null)
    : (this.operation.trendHasValue() ? this.operation.trend() : null));

  /** A leitura do fluxo falhou agora. */
  private readonly flowFailed = computed(() => this.flowScope() === 'company' ? this.store.volumeFailed() : !!this.operation.trendError());

  /** Pontos exibidos: os de agora ou os últimos bons do mesmo escopo e agrupamento (ver {@link counts}). */
  private readonly shownPoints = linkedSignal<{ key: string; value: TicketVolumePoint[] | null }, TicketVolumePoint[] | null>({
    source: () => ({ key: `${this.flowScope()}|${this.flowGroupBy()}`, value: this.livePoints() }),
    computation: (current, previous) => current.value ?? (previous && previous.source.key === current.key ? previous.value : null)
  });

  /** Pontos do fluxo por período, do escopo (vazio sem resposta). */
  protected readonly flowPoints = computed((): TicketVolumePoint[] => this.shownPoints() ?? []);

  /** Estado do fluxo: vazio quando nenhum período tem chamado; com pontos antigos na tela, não é erro. */
  protected readonly flowState = computed(() => {
    const points = this.flowPoints();
    const empty = points.every(point => point.count === 0 && !point.resolvedCount);
    return widgetState({
      available: this.flowScope() === 'company' ? this.store.companyStatsAvailable() : true,
      failed: this.flowFailed() && this.shownPoints() === null,
      hasValue: this.shownPoints() !== null,
      empty
    });
  });

  /** A última atualização falhou, mas os números anteriores continuam na tela (velhos). */
  protected readonly staleAfterFailure = computed(() =>
    (this.countsFailed() && this.counts() !== null) || (this.flowFailed() && this.shownPoints() !== null)
    || (this.filteredAvailable() && this.operation.overviewStale()));

  /** Frase de destaque do gráfico, só com o fluxo carregado. */
  protected readonly insight = computed(() => this.flowState() === 'ready' ? volumeInsight(this.flowPoints(), this.flowGroupBy(), this.features.volumeResolved) : null);

  /** Os números da empresa não existem pra este papel ainda: indicadores e gráfico viram um aviso só. */
  protected readonly companyUnavailable = computed(() => this.countsState() === 'unavailable' && this.flowState() === 'unavailable');

  /**
   * Primeiro uso: a empresa não tem nenhum chamado (sem filtro) — o gráfico vazio vira um convite
   * com a próxima ação, em vez de só "nenhum chamado".
   */
  protected readonly isFirstUse = computed(() => this.chartScope() === 'company' && this.counts()?.totalCount === 0);

  // ── Destinos (drill-down) ─────────────────────────────────────────────────────────────────────

  /**
   * Destino de um número: quem atende a fila vai pro Monitorar com os filtros da URL e o filtro do
   * número; os demais vão pra Meus Chamados, que mostra só os próprios — com o aviso de quantos
   * deles a pessoa vê, quando é menos que o número da empresa.
   */
  private link(monitorExtra: Params, mineParams: Params, own: number | null, company: number | null): DashboardLink {
    if (this.showOperation()) {
      return { route: '/tickets/monitorar', queryParams: toMonitorQueryParams(this.scope() ?? {}, monitorExtra) };
    }
    return { route: '/tickets', queryParams: mineParams, note: company === null ? null : accessNote(own, company) };
  }

  /** Destino de cada grupo de status (barra e legenda). */
  protected readonly statusLinks = computed((): Record<DashboardStatusGroup, DashboardLink | null> => {
    const counts = this.counts();
    const mine = this.myTickets;
    const status = (group: DashboardStatusGroup) => ({ status: DASHBOARD_STATUS_GROUP_STATUS[group] });
    return {
      open: this.link(status('open'), {}, mine?.openCount() ?? null, counts?.openCount ?? null),
      inProgress: this.link(status('inProgress'), {}, mine?.inProgressCount() ?? null, counts?.inProgressCount ?? null),
      resolved: this.link(status('resolved'), { status: 'finished' }, mine?.resolvedOnlyCount() ?? null, counts?.resolvedCount ?? null),
      closed: this.link(status('closed'), { status: 'finished' }, mine?.closedCount() ?? null, counts?.closedCount ?? null)
    };
  });

  /** Destino de um período do fluxo: o Monitorar com os chamados criados nele (só quem atende a fila). */
  protected readonly bucketLink = computed(() => {
    if (!this.showOperation()) return null;
    const groupBy = this.flowGroupBy();
    // Fluxo da empresa (sem o volume do recorte): o período abre sem os filtros, pra lista bater com a barra.
    const scope = this.flowScope() === 'filtered' ? this.scope() ?? {} : {};
    return (periodStart: string): DashboardLink => {
      const range = bucketRange(periodStart, groupBy);
      return { route: '/tickets/monitorar', queryParams: toMonitorQueryParams({ ...scope, from: range.from, to: range.to }) };
    };
  });

  // ── Indicadores ───────────────────────────────────────────────────────────────────────────────

  /** Taxa de SLA cumprido do agregado (com comparação, se houver período anterior); null sem resolvidos. */
  protected readonly slaLead = computed((): DashboardMetricLead | null => {
    const sla = this.operation.sla();
    if (!sla) return null;
    const rate = slaRate(sla.metCount, sla.missedCount);
    if (rate === null) return null;
    const previous = this.operation.previousOverview()?.sla;
    const previousRate = previous ? slaRate(previous.metCount, previous.missedCount) : null;
    let trend: string | null = null;
    if (previousRate !== null) {
      const diff = rate - previousRate;
      trend = diff === 0 ? 'igual ao período anterior' : `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'ponto' : 'pontos'} ${diff > 0 ? 'acima' : 'abaixo'} do período anterior`;
    }
    return { value: `${rate}%`, text: 'dos resolvidos cumpriram o prazo', trend };
  });

  /** Faixa do topo: total, na fila, em andamento, resolvidos, fechados e atrasados (ou SLA cumprido, pra quem não atende). */
  protected readonly kpis = computed((): DashboardKpi[] => {
    const counts = this.counts();
    const mine = this.myTickets;
    const previous = this.chartScope() === 'filtered' ? this.operation.previousOverview()?.volume : undefined;
    const backlog = counts ? counts.openCount + counts.inProgressCount : null;
    return [
      { key: 'total', label: 'Total', value: counts?.totalCount ?? null, trend: countTrend(counts?.totalCount, previous?.totalCount),
        link: this.link({}, { status: 'all' }, mine?.totalCount() ?? null, counts?.totalCount ?? null) },
      { key: 'backlog', label: 'Na fila', value: backlog, hint: 'abertos e em andamento',
        link: this.link({ status: 'active' }, {}, mine?.activeCount() ?? null, backlog) },
      { key: 'inProgress', label: 'Em andamento', group: 'inProgress', value: counts?.inProgressCount ?? null, link: this.statusLinks().inProgress },
      { key: 'resolved', label: 'Resolvidos', group: 'resolved', value: counts?.resolvedCount ?? null, link: this.statusLinks().resolved },
      { key: 'closed', label: 'Fechados', group: 'closed', value: counts?.closedCount ?? null, link: this.statusLinks().closed },
      this.sixthKpi()
    ];
  });

  /**
   * Sexto indicador, pra quem atende a fila: os chamados atrasados — o risco fica na primeira tela, e
   * a taxa de SLA cumprido mora no grupo de SLA (decisão de 2026-10-28). Com o agregado (spec 026), o
   * número segue o escopo dos outros; sem ele, vem dos Alertas de SLA (a empresa toda). Pros demais,
   * "SLA cumprido" em breve.
   */
  private sixthKpi(): DashboardKpi {
    if (this.filteredAvailable()) {
      const overview = this.operation.overview();
      return { key: 'overdue', label: 'Atrasados', value: overview?.attention.breachedCount ?? null, risk: true,
        loading: overview === null && !this.operation.overviewFailed(), hint: 'passaram do prazo',
        link: this.link({ slaStatus: TicketSlaStatus.Breached }, {}, null, null) };
    }
    if (this.showOperation()) {
      const loaded = this.store.criticalTicketsLoadedAtMs() !== null;
      return { key: 'overdue', label: 'Atrasados', value: loaded ? this.store.breachedCount() : null, risk: true,
        loading: !loaded && !this.store.criticalTicketsError(), hint: 'passaram do prazo',
        link: this.link({ slaStatus: TicketSlaStatus.Breached }, {}, null, null) };
    }
    return { key: 'sla', label: 'SLA cumprido', value: null, unavailable: true, link: null };
  }

  // ── Operação (abaixo da dobra) ────────────────────────────────────────────────────────────────

  /** SLA do agregado, do mais grave ao cumprido; os atrasados ficam só no topo da tela, pra não repetir o número. */
  protected readonly slaMetrics = computed((): DashboardMetric[] => {
    const scope = this.scope() ?? {};
    const sla = this.operation.sla();
    const since = this.hasPeriod() ? 'abertos no período' : 'desde o início';
    return [
      { key: 'atRisk', label: 'Em risco', icon: 'bx-time', tone: 'warning', value: sla?.atRiskCount ?? null, hint: 'Ativos, perto do prazo', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.AtRisk }) },
      { key: 'onTime', label: 'No prazo', icon: 'bx-timer', tone: 'info', value: sla?.onTimeCount ?? null, hint: 'Ativos, com folga', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.OnTime }) },
      { key: 'met', label: 'Cumpridos', icon: 'bx-check-circle', tone: 'success', value: sla?.metCount ?? null, hint: `Resolvidos no prazo, ${since}`, queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Met }) },
      { key: 'missed', label: 'Resolvidos com atraso', icon: 'bx-calendar-x', tone: 'danger', value: sla?.missedCount ?? null, hint: `Fora do prazo, ${since}`, queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Missed }) }
    ];
  });

  /**
   * Central de atenção, em ordem de gravidade: críticos, sem responsável e, quando o back-end manda
   * (spec 029), os que esperam a equipe e os que esperam o solicitante. Os atrasados ficam no topo
   * da tela (sexto indicador), pra não repetir o número.
   */
  protected readonly attentionMetrics = computed((): DashboardMetric[] => {
    const scope = this.scope() ?? {};
    const attention = this.operation.attention();
    const awaiting: DashboardMetric[] = [];
    if (attention?.awaitingAgentCount !== undefined) {
      awaiting.push({ key: 'awaitingAgent', label: 'Aguardando a equipe', icon: 'bx-message-square-dots', tone: 'warning', value: attention.awaitingAgentCount, hint: 'A última palavra é do solicitante', queryParams: toMonitorQueryParams(scope, { awaiting: TicketAwaiting.Agent, status: 'active' }) });
    }
    if (attention?.awaitingRequesterCount !== undefined) {
      awaiting.push({ key: 'awaitingRequester', label: 'Aguardando o solicitante', icon: 'bx-user-voice', tone: 'info', value: attention.awaitingRequesterCount, hint: 'A equipe respondeu por último', queryParams: toMonitorQueryParams(scope, { awaiting: TicketAwaiting.Requester, status: 'active' }) });
    }
    return [
      { key: 'critical', label: 'Críticos', icon: 'bx-error-alt', tone: 'danger', value: attention?.criticalCount ?? null, hint: 'Urgentes, ainda ativos', queryParams: toMonitorQueryParams(scope, { priority: TicketPriority.Urgent, status: 'active' }) },
      { key: 'unassigned', label: 'Sem responsável', icon: 'bx-user-x', tone: 'warning', value: attention?.unassignedCount ?? null, hint: 'Ativos, ninguém assumiu', queryParams: toMonitorQueryParams(scope, { unassignedOnly: 'true', status: 'active' }) },
      ...awaiting
    ];
  });

  /** Vazio da Central e do SLA: com filtro no escopo, a culpa é do filtro; sem, a operação ainda não tem chamados. */
  protected readonly emptyTitle = computed(() => this.chartScope() === 'filtered' && this.filters.active() ? 'Nenhum chamado com estes filtros.' : 'Nenhum chamado ainda.');
  /** Dica do vazio, com a próxima ação de cada caso. */
  protected readonly emptyHint = computed(() => this.chartScope() === 'filtered' && this.filters.active()
    ? 'Ajuste ou limpe os filtros acima para ver mais chamados.'
    : 'Quando o primeiro chamado for aberto, os números aparecem aqui.');

  /** A linha secundária tem o que mostrar pra este papel (operação, "Seus chamados" ou os atalhos). */
  protected readonly hasSecondaryRow = computed(() =>
      this.showOperation() || this.showMyTickets() || !this.isAdministrative());

  /** SLA detalhado e tempos estão os dois esperando o back-end: um aviso só pra linha. */
  protected readonly secondaryUnavailable = computed(() => !this.features.operationOverview && !this.features.averageTimes);

  /** Os 3 cards de "Seus chamados", com as contagens do próprio usuário, cada um abrindo Meus Chamados. */
  protected readonly myTicketCards = computed(() => [
    { label: 'Em aberto', icon: 'bx-error-circle', tone: 'warning' as StatTone, value: this.myTickets?.openCount() ?? null, queryParams: {} },
    { label: 'Em andamento', icon: 'bx-time-five', tone: 'info' as StatTone, value: this.myTickets?.inProgressCount() ?? null, queryParams: {} },
    { label: 'Resolvidos', icon: 'bx-check-double', tone: 'success' as StatTone, value: this.myTickets?.resolvedCount() ?? null, queryParams: { status: 'finished' } }
  ]);

  // ── Atualização ───────────────────────────────────────────────────────────────────────────────

  /** Alguma fonte ligada está buscando dados. */
  private readonly anyLoading = computed(() =>
      this.store.statusCountsLoading() || this.store.volumeLoading() || this.store.criticalTicketsLoading() || this.store.criticalTicketsRefreshing()
      || this.operation.overviewLoading() || this.operation.timesLoading() || this.operation.trendLoading() || !!this.myTickets?.loading());

  /** Já há algum número na tela (a primeira carga terminou com dado). */
  private readonly hasAnyData = computed(() =>
      this.store.statusCounts() !== null || this.store.criticalTicketsLoadedAtMs() !== null || (this.myTickets?.totalCount() ?? null) !== null);

  /** Quando os números foram atualizados pela última vez (ms), ou null antes da primeira carga. */
  protected readonly updatedAtMs = signal<number | null>(null);
  /** Relógio do "Atualizado há N min", avançado a cada 30s. */
  protected readonly nowMs = signal(Date.now());
  /** Texto da idade dos números; depois de uma atualização que falhou, diz de quando são os que estão na tela. */
  protected readonly freshness = computed(() => {
    const updatedAt = this.updatedAtMs();
    if (this.staleAfterFailure() && updatedAt !== null) {
      const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(updatedAt);
      return `Falha ao atualizar · números das ${time}`;
    }
    return freshnessLabel(updatedAt, this.nowMs());
  });
  /** Recarregando com os números anteriores na tela: só um indicador discreto no "Atualizado há". */
  protected readonly refreshing = computed(() => this.anyLoading() && this.updatedAtMs() !== null);
  /** Aviso pro leitor de tela a cada atualização — só "Atualizado agora", nunca os números. */
  protected readonly liveAnnouncement = signal('');

  /** Chamado do alerta de SLA que está recebendo um responsável (diálogo "Atribuir" aberto), ou null. */
  protected readonly assigningTicket = signal<TicketMonitorItem | null>(null);

  /** Liga o escopo, os widgets à URL, a hora da última atualização e a atualização automática. */
  constructor() {
    // Com a URL trazendo filtros e o escopo "Com filtros" disponível, a tela abre nele.
    if (this.filteredAvailable() && this.filters.active()) this.operation.setChartScope('filtered');

    // Os widgets operacionais seguem o escopo: recorte da URL em "Com filtros", empresa toda no outro
    // (trocar um filtro cancela as requisições em voo).
    effect(() => {
      const scope = this.scope();
      if (!scope) return;
      this.operation.setScope(this.chartScope() === 'filtered' ? scope : {});
    });

    // Marca a hora de cada carga concluída. Depois de uma atualização, avisa o leitor de tela: limpa e
    // escreve de novo, pra a mesma frase ser lida toda vez (uma região que não muda não é anunciada).
    // Uma atualização que falhou não conta como atualizada: a hora fica a dos números na tela.
    effect(() => {
      if (this.anyLoading() || !this.hasAnyData()) return;
      const failed = this.staleAfterFailure();
      untracked(() => {
        if (!failed) this.updatedAtMs.set(Date.now());
        if (!this.announceNext) return;
        this.announceNext = false;
        this.liveAnnouncement.set('');
        setTimeout(() => this.liveAnnouncement.set(failed ? 'Não foi possível atualizar os números' : 'Atualizado agora'), 100);
      });
    });

    if (isPlatformBrowser(this.platformId)) {
      const tick = setInterval(() => this.nowMs.set(Date.now()), FRESHNESS_TICK_MS);
      this.destroyRef.onDestroy(() => clearInterval(tick));
      this.autoRefresh = startDashboardAutoRefresh(this.document, () => this.updatedAtMs(), () => this.refresh(), this.destroyRef);
    }
  }

  /** Carrega os totais, o volume e os alertas ao abrir a tela. */
  ngOnInit() {
    this.store.load();
  }

  /** Atualiza tudo que está ligado (automático a cada 2 min), mantendo os números na tela. */
  refresh(): void {
    this.announceNext = true;
    this.nowMs.set(Date.now());
    this.store.load();
    this.operation.refresh();
    if (this.showMyTickets()) this.myTickets?.reload();
  }

  /** Botão "Atualizar" do cabeçalho: atualiza agora e recomeça a contagem dos 2 min. */
  refreshNow(): void {
    this.refresh();
    this.autoRefresh?.restart();
  }

  /** Troca de um filtro na barra (grava na URL; os widgets seguem a URL). */
  protected onFilterChange(partial: Partial<DashboardFilters>): void {
    this.filters.update(partial);
  }

  /** Troca o escopo do gráfico e dos indicadores. */
  protected setChartScope(scope: TicketDashboardChartScope): void {
    this.operation.setChartScope(scope);
  }

  /** Muda o agrupamento do fluxo (dia/semana/mês), na fonte do escopo. */
  setGroupBy(groupBy: TicketVolumeGrouping): void {
    if (this.flowScope() === 'filtered') {
      this.operation.setGroupBy(groupBy);
    } else {
      this.store.setGroupBy(groupBy);
    }
  }

  /** "Tentar novamente" dos totais por status, na fonte do escopo. */
  reloadCounts(): void {
    if (this.chartScope() === 'filtered') {
      this.operation.reloadOverview();
    } else {
      this.store.load();
    }
  }

  /** "Tentar novamente" do fluxo, na fonte do escopo. */
  reloadFlow(): void {
    if (this.flowScope() === 'filtered') {
      this.operation.reloadTrend();
    } else {
      this.store.load();
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
}
