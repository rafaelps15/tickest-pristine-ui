import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyTicketsSummaryStore, TicketSummaryStore, TicketDashboardStore, TicketAssigneesStore, TicketAwaiting, TicketMonitorItem, TicketVolumePoint, TicketVolumeGrouping, TicketStatus, TicketSlaStatus, TicketPriority } from '../tickets';
import { DepartmentsStore } from '../departments';
import { DashboardFiltersService } from './dashboard-filters.service';
import { DashboardFilters, resolveDashboardScope, toMonitorQueryParams, todayInSaoPaulo } from './dashboard-filters';
import { DashboardTimesComponent } from './dashboard-times.component';
import { DashboardVolumeChartComponent } from './dashboard-volume-chart.component';
import { DashboardFilterBarComponent } from './dashboard-filter-bar.component';
import { DashboardMetric, DashboardMetricGroupComponent } from './dashboard-metric-group.component';
import { SessionService, ToastService } from '../shared';
import { DashboardGuideComponent } from './dashboard-guide.component';
import { DashboardInsightsComponent } from './dashboard-insights.component';
import { PageHeaderComponent } from '../shared/ui/page-header/page-header.component';
import { StatCardComponent, StatTone } from '../shared/ui/stat-card/stat-card.component';
// O shell pode ligar peças de um domínio direto (como faz com as telas feature-*): o diálogo depende de
// UserSummary (domínio users), por isso mora em tickets/ui e não em shared/ui.
import { TicketAssignDialogComponent } from '../tickets/ui/ticket-assign-dialog/ticket-assign-dialog.component';

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
    imports: [RouterLink, PageHeaderComponent, DashboardGuideComponent, DashboardInsightsComponent, StatCardComponent, TicketAssignDialogComponent, DashboardFilterBarComponent, DashboardMetricGroupComponent, DashboardTimesComponent, DashboardVolumeChartComponent],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardFiltersService],
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
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
  /** Responsáveis elegíveis pro filtro de responsável (GET /tickets/assignees). */
  protected readonly assigneesStore = inject(TicketAssigneesStore);

  /** Hoje no horário de Brasília — base dos períodos prontos ("Últimos 30 dias"), calculado por visita à tela. */
  protected readonly today = todayInSaoPaulo();

  /**
   * Recorte da API a partir dos filtros da URL (departamento → setores, período → datas); null
   * enquanto um departamento da URL espera a lista de departamentos.
   */
  protected readonly scope = computed(() => resolveDashboardScope(
    this.filters.filters(), this.departmentsStore.departments(), this.departmentsStore.listState().loading, this.today));

  /** Vazio do Volume e do SLA: com filtro, a culpa é do filtro; sem filtro, a operação ainda não tem chamados. */
  protected readonly emptyTitle = computed(() => this.filters.active() ? 'Nenhum chamado com estes filtros.' : 'Nenhum chamado ainda.');
  /** Dica do vazio, com a próxima ação de cada caso. */
  protected readonly emptyHint = computed(() => this.filters.active()
    ? 'Ajuste ou limpe os filtros acima para ver mais chamados.'
    : 'Quando o primeiro chamado for aberto, os números aparecem aqui.');

  /** Se há período escolhido (muda os textos de apoio de SLA, tempos e gráfico). */
  protected readonly hasPeriod = computed(() => !!(this.scope()?.from || this.scope()?.to));

  /** Mostra os widgets operacionais filtráveis: só pra quem atende a fila (a API exige `tickets:manage`). */
  protected readonly showOperation = computed(() => this.sessionService.hasPermission('tickets:manage'));

  /** Volume com os filtros; cada card leva ao Monitor com os mesmos filtros e o status do card. */
  protected readonly volumeMetrics = computed((): DashboardMetric[] => {
    const scope = this.scope() ?? {};
    const volume = this.operation.volume();
    return [
      { key: 'total', label: 'Total', icon: 'bx-receipt', tone: 'primary', value: volume?.total ?? null, hint: 'Todos os status', queryParams: toMonitorQueryParams(scope) },
      { key: 'backlog', label: 'Na fila', icon: 'bx-error-circle', tone: 'warning', value: volume?.backlog ?? null, hint: 'Aberto ou em andamento', queryParams: toMonitorQueryParams(scope, { status: 'active' }) },
      { key: 'inProgress', label: 'Em andamento', icon: 'bx-time-five', tone: 'info', value: volume?.inProgress ?? null, queryParams: toMonitorQueryParams(scope, { status: TicketStatus.InProgress }) },
      { key: 'resolved', label: 'Resolvidos', icon: 'bx-check-double', tone: 'success', value: volume?.resolved ?? null, queryParams: toMonitorQueryParams(scope, { status: TicketStatus.Resolved }) },
      { key: 'closed', label: 'Fechados', icon: 'bx-lock-alt', tone: 'primary', value: volume?.closed ?? null, queryParams: toMonitorQueryParams(scope, { status: TicketStatus.Closed }) }
    ];
  });

  /** SLA com os filtros, do mais grave ao cumprido; os atrasados ficam só na Central de atenção, pra não repetir o número. */
  protected readonly slaMetrics = computed((): DashboardMetric[] => {
    const scope = this.scope() ?? {};
    const sla = this.operation.sla();
    const since = this.hasPeriod() ? 'abertos no período' : 'desde o início';
    return [
      { key: 'atRisk', label: 'Em risco', icon: 'bx-time', tone: 'warning', value: sla?.atRisk ?? null, hint: 'A partir de 75% do prazo', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.AtRisk }) },
      { key: 'onTime', label: 'No prazo', icon: 'bx-timer', tone: 'info', value: sla?.onTime ?? null, hint: 'Ativos, com folga', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.OnTime }) },
      { key: 'met', label: 'Cumpridos', icon: 'bx-check-circle', tone: 'success', value: sla?.met ?? null, hint: `Resolvidos no prazo, ${since}`, queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Met }) },
      { key: 'missed', label: 'Resolvidos com atraso', icon: 'bx-calendar-x', tone: 'danger', value: sla?.missed ?? null, hint: `Fora do prazo, ${since}`, queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Missed }) }
    ];
  });

  /**
   * Central de atenção, em ordem de gravidade: atrasados, críticos, sem responsável e, quando o
   * back-end manda (spec 029), os que esperam a equipe e os que esperam o solicitante.
   */
  protected readonly attentionMetrics = computed((): DashboardMetric[] => {
    const scope = this.scope() ?? {};
    const attention = this.operation.attention();
    const awaiting: DashboardMetric[] = [];
    if (attention?.awaitingAgent !== undefined) {
      awaiting.push({ key: 'awaitingAgent', label: 'Aguardando a equipe', icon: 'bx-message-square-dots', tone: 'warning', value: attention.awaitingAgent, hint: 'A última palavra é do solicitante', queryParams: toMonitorQueryParams(scope, { awaiting: TicketAwaiting.Agent, status: 'active' }) });
    }
    if (attention?.awaitingRequester !== undefined) {
      awaiting.push({ key: 'awaitingRequester', label: 'Aguardando o solicitante', icon: 'bx-user-voice', tone: 'info', value: attention.awaitingRequester, hint: 'A equipe respondeu por último', queryParams: toMonitorQueryParams(scope, { awaiting: TicketAwaiting.Requester, status: 'active' }) });
    }
    return [
      { key: 'overdue', label: 'Atrasados', icon: 'bx-error', tone: 'danger', value: attention?.overdue ?? null, hint: 'Passaram do prazo', queryParams: toMonitorQueryParams(scope, { slaStatus: TicketSlaStatus.Breached }) },
      { key: 'critical', label: 'Críticos', icon: 'bx-error-alt', tone: 'danger', value: attention?.critical ?? null, hint: 'Urgentes, ainda ativos', queryParams: toMonitorQueryParams(scope, { priority: TicketPriority.Urgent, status: 'active' }) },
      { key: 'unassigned', label: 'Sem responsável', icon: 'bx-user-x', tone: 'warning', value: attention?.unassigned ?? null, hint: 'Ativos, ninguém assumiu', queryParams: toMonitorQueryParams(scope, { unassignedOnly: 'true', status: 'active' }) },
      ...awaiting
    ];
  });

  /**
   * Resumo da operação pro leitor de tela, anunciado uma vez quando os números chegam ou mudam com
   * os filtros: o que pede ação (a Central inteira) e uma linha de contexto (na fila e em risco).
   */
  protected readonly operationSummary = computed(() => {
    if (this.operation.overviewLoading() || this.operation.overviewError() || !this.operation.volume()) return '';
    const attention = this.attentionMetrics().map(metric => `${metric.label.toLowerCase()} ${metric.value}`).join(', ');
    const volume = this.operation.volume()!;
    const sla = this.operation.sla()!;
    return `Central de atenção: ${attention}. Na fila: ${volume.backlog}; em risco: ${sla.atRisk}.`;
  });

  /** Troca de um filtro na barra (grava na URL; os widgets seguem a URL). */
  protected onFilterChange(partial: Partial<DashboardFilters>): void {
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
      value: this.store.openCount()
    },
    {
      status: TicketStatus.InProgress,
      label: 'Em Andamento',
      tone: 'info' as StatTone,
      icon: 'bx-time-five',
      value: this.store.inProgressCount()
    },
    {
      status: TicketStatus.Resolved,
      label: 'Resolvidos',
      tone: 'success' as StatTone,
      icon: 'bx-check-double',
      value: this.store.resolvedCount()
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
    { label: 'Em aberto', icon: 'bx-error-circle', tone: 'warning' as StatTone, value: this.myTickets.openCount(), queryParams: {} },
    { label: 'Em andamento', icon: 'bx-time-five', tone: 'info' as StatTone, value: this.myTickets.inProgressCount(), queryParams: {} },
    { label: 'Resolvidos', icon: 'bx-check-double', tone: 'success' as StatTone, value: this.myTickets.resolvedCount(), queryParams: { status: 'finished' } }
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
  protected readonly isFirstUse = computed(() => this.showOperation()
      // Quem atende a fila: o total do agregado, sem filtro nenhum (com filtro, zero não é "empresa nova").
      ? !this.filters.active() && this.operation.volume()?.total === 0
      : !this.store.statusCountsLoading() && !this.store.statusCountsFailed() && this.store.total() === 0);

  /** Quem pode cadastrar a estrutura (departamentos/setores) — no primeiro uso, é o passo que vem antes de qualquer ticket. */
  protected readonly canSetUpStructure = computed(() =>
      this.sessionService.hasPermission('departments:manage') || this.sessionService.hasPermission('sectors:manage'));

  /**
   * Fonte do gráfico: pra quem atende a fila, o Criados x Resolvidos com o recorte da barra
   * (TicketDashboardStore); pros demais, o volume da empresa toda (TicketSummaryStore).
   */
  protected readonly chartPoints = computed((): TicketVolumePoint[] => this.showOperation() ? this.operation.trend() : this.store.volume());
  /** Agrupamento do gráfico, da mesma fonte. */
  protected readonly chartGroupBy = computed(() => this.showOperation() ? this.operation.groupBy() : this.store.groupBy());
  /** Carregando o gráfico. */
  protected readonly chartLoading = computed(() => this.showOperation() ? this.operation.trendLoading() : this.store.volumeLoading());
  /** O gráfico falhou. */
  protected readonly chartFailed = computed(() => this.showOperation() ? !!this.operation.trendError() : this.store.volumeFailed());
  constructor() {
    // Os widgets operacionais seguem os filtros da URL (trocar um filtro cancela as requisições em voo).
    effect(() => {
      const scope = this.scope();
      if (scope) this.operation.setScope(scope);
    });

  }

  /** Carrega os totais por status e o volume de tickets da empresa ao inicializar a tela. */
  ngOnInit() {
    this.store.load();
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
    if (this.showOperation()) {
      this.operation.setGroupBy(groupBy);
    } else {
      this.store.setGroupBy(groupBy);
    }
  }

  /** "Tentar novamente" do gráfico, na fonte certa. */
  reloadChart(): void {
    if (this.showOperation()) {
      this.operation.reloadTrend();
    } else {
      this.store.load();
    }
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


}
