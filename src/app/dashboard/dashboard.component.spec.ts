import { TestBed } from '@angular/core/testing';
import { computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { DashboardComponent, countTrend, greetingForHour, slaRate } from './dashboard.component';
import { MyTicketsSummaryStore, TicketSummaryStore, TicketDashboardStore, TicketAssigneesStore, TicketAssignee, TicketAverageTimes, TicketDashboardOverview, TicketDashboardVolume, TicketDashboardSla, TicketDashboardAttention, TicketVolumeGrouping, TicketVolumePoint, TicketMonitorItem, TicketStatusCounts, TicketDashboardChartScope } from '../tickets';
import { DepartmentsStore, Department } from '../departments';
import { DASHBOARD_FEATURES, DashboardFeatures, SessionService, ToastService } from '../shared';

/** 30 dias de volume, 10 criados por dia, terminando em 28/10/2026. */
function thirtyDays(count = 10): TicketVolumePoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 8, 29 + i));
    return { periodStart: date.toISOString().slice(0, 10), count };
  });
}

describe('DashboardComponent', () => {
  /** Store falso dos widgets operacionais (agregado, tempos médios e volume do recorte), com signals reais. */
  function createOperationStoreFake() {
    const volume = signal<TicketDashboardVolume | null>({ totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0, backlogCount: 5 });
    const sla = signal<TicketDashboardSla | null>({ onTimeCount: 3, atRiskCount: 1, breachedCount: 2, metCount: 7, missedCount: 1, notApplicableCount: 0 });
    const attention = signal<TicketDashboardAttention | null>({ breachedCount: 2, criticalCount: 1, unassignedCount: 3 });
    const overviewError = signal<string | null>(null);
    const times = signal<TicketAverageTimes | null>({
      firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
      resolution: { averageMinutes: null, medianMinutes: null, sampleSize: 4 },
      minimumSampleSize: 5
    });
    const timesError = signal<string | null>(null);
    // O agregado inteiro existe enquanto os três blocos existem (como no store, que os deriva dele).
    const overview = computed((): TicketDashboardOverview | null => {
      const [v, s, a] = [volume(), sla(), attention()];
      return v && s && a ? { serverNowUtc: '2026-10-28T12:00:00Z', volume: v, sla: s, attention: a } : null;
    });
    return {
      volume,
      sla,
      attention,
      overview,
      overviewFailed: computed(() => overviewError() !== null && overview() === null),
      overviewStale: computed(() => overviewError() !== null && overview() !== null),
      previousOverview: signal<TicketDashboardOverview | null>(null),
      overviewLoading: signal(false),
      overviewError,
      times,
      timesLoading: signal(false),
      timesError,
      timesFailed: computed(() => timesError() !== null && times() === null),
      timesStale: computed(() => timesError() !== null && times() !== null),
      trend: signal<TicketVolumePoint[]>([{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]),
      trendHasValue: signal(true),
      trendLoading: signal(false),
      trendError: signal<string | null>(null),
      groupBy: signal<TicketVolumeGrouping>('Day'),
      trendGroupBy: signal<TicketVolumeGrouping>('Day'),
      unavailableGroupings: signal<TicketVolumeGrouping[]>([]),
      chartScope: signal<TicketDashboardChartScope>('company'),
      setScope: jasmine.createSpy('setScope'),
      setGroupBy: jasmine.createSpy('setGroupBy'),
      setChartScope: jasmine.createSpy('setChartScope'),
      holdScope: jasmine.createSpy('holdScope'),
      refresh: jasmine.createSpy('refresh'),
      reloadOverview: jasmine.createSpy('reloadOverview'),
      reloadTimes: jasmine.createSpy('reloadTimes'),
      reloadTrend: jasmine.createSpy('reloadTrend')
    };
  }

  /** Store falso dos números da empresa e dos alertas de SLA, com signals reais. */
  function createTicketsStoreFake() {
    return {
      companyStatsAvailable: signal(true),
      summaryError: signal<string | null>(null),
      statusCounts: signal<TicketStatusCounts | null>({ totalCount: 12, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 2 }),
      statusCountsLoading: signal(false),
      statusCountsFailed: signal(false),
      volume: signal<TicketVolumePoint[]>(thirtyDays()),
      volumeHasValue: signal(true),
      volumeLoading: signal(false),
      volumeFailed: signal(false),
      groupBy: signal<TicketVolumeGrouping>('Day'),
      load: jasmine.createSpy('load'),
      setGroupBy: jasmine.createSpy('setGroupBy'),
      criticalTickets: signal<TicketMonitorItem[]>([]),
      breachedCount: signal(0),
      atRiskCount: signal(0),
      clockOffsetMs: signal(0),
      criticalTicketsLoadedAtMs: signal<number | null>(null),
      criticalTicketsRefreshing: signal(false),
      reloadCritical: jasmine.createSpy('reloadCritical'),
      setCriticalScope: jasmine.createSpy('setCriticalScope'),
      holdCriticalScope: jasmine.createSpy('holdCriticalScope'),
      assigneeCandidates: signal([]),
      searchingAssignees: signal(false),
      assigneeSearchError: signal<string | null>(null),
      assigning: signal(false),
      assignError: signal<string | null>(null),
      searchAssignees: jasmine.createSpy('searchAssignees'),
      resetAssignment: jasmine.createSpy('resetAssignment'),
      clearAssignError: jasmine.createSpy('clearAssignError'),
      assignResponsible: jasmine.createSpy('assignResponsible'),
      criticalTicketsLoading: signal(false),
      criticalTicketsError: signal<string | null>(null)
    };
  }

  /** Store falso de "Seus chamados". */
  function createMyTicketsFake() {
    return {
      openCount: signal<number | null>(2), inProgressCount: signal<number | null>(1), resolvedCount: signal<number | null>(5),
      resolvedOnlyCount: signal<number | null>(4), closedCount: signal<number | null>(1),
      activeCount: signal<number | null>(3), finishedCount: signal<number | null>(5), totalCount: signal<number | null>(8),
      loading: signal(false), busy: signal(false), failed: signal(false), stale: signal(false), reload: jasmine.createSpy('reload')
    };
  }

  type CurrentUserFake = { firstName: string; roles: { name: string }[] } | null;

  let operationFake: ReturnType<typeof createOperationStoreFake>;
  let ticketsStoreFake: ReturnType<typeof createTicketsStoreFake>;
  let myTicketsFake: ReturnType<typeof createMyTicketsFake>;
  let departmentsFake: { departments: ReturnType<typeof signal<Department[]>>; listState: ReturnType<typeof signal<{ loading: boolean }>> };
  let assigneesFake: { assignees: ReturnType<typeof signal<TicketAssignee[]>>; total: ReturnType<typeof signal<number>> };
  let hasPermission: jasmine.Spy;
  let currentUser: ReturnType<typeof signal<CurrentUserFake>>;
  let toastServiceFake: { show: jasmine.Spy };
  let features: DashboardFeatures;
  /** Se a tela pediu o store de "Seus chamados" (ele busca sozinho ao nascer). */
  let myTicketsCreated: boolean;

  /** Só a permissão de quem atende a fila. */
  const asAgent = () => hasPermission.and.callFake((code: string) => code === 'tickets:manage');
  /** Só a permissão de quem abre chamados. */
  const asRequester = () => hasPermission.and.callFake((code: string) => code === 'tickets:view-own');

  beforeEach(async () => {
    ticketsStoreFake = createTicketsStoreFake();
    operationFake = createOperationStoreFake();
    myTicketsFake = createMyTicketsFake();
    myTicketsCreated = false;
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);
    currentUser = signal<CurrentUserFake>({ firstName: 'Maria', roles: [{ name: 'Colaborador' }] });
    toastServiceFake = { show: jasmine.createSpy('show') };
    features = { operationOverview: false, averageTimes: false, volumeResolved: false, companyStatsForAll: false, listPeriodFilter: false };
    departmentsFake = {
      departments: signal<Department[]>([{ id: 'd1', name: 'TI', description: '', responsibleUserName: null, sectors: [{ id: 's1', name: 'Helpdesk', description: null }, { id: 's2', name: 'Infra', description: null }] }]),
      listState: signal({ loading: false })
    };
    assigneesFake = { assignees: signal<TicketAssignee[]>([{ id: 'u-ana', fullName: 'Ana Souza', sectorId: 's1', sectorName: 'Helpdesk' }]), total: signal(1) };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketSummaryStore, useValue: ticketsStoreFake },
        { provide: TicketDashboardStore, useValue: operationFake },
        { provide: DepartmentsStore, useValue: departmentsFake },
        { provide: TicketAssigneesStore, useValue: assigneesFake },
        { provide: MyTicketsSummaryStore, useFactory: () => { myTicketsCreated = true; return myTicketsFake; } },
        { provide: SessionService, useValue: { hasPermission, currentUser } },
        { provide: ToastService, useValue: toastServiceFake },
        { provide: DASHBOARD_FEATURES, useFactory: () => features }
      ]
    }).compileComponents();
  });

  /** Cria a tela e espera renderizar. */
  async function render() {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();
    return fixture;
  }

  /** Os cards da faixa do topo, como texto. */
  const kpiTexts = (root: HTMLElement) => Array.from(root.querySelectorAll('.kpi-card') as NodeListOf<HTMLElement>)
    .map(card => Array.from(card.querySelectorAll('.kpi-label-text, .kpi-value, .kpi-hint, .kpi-soon')).map(part => part.textContent?.trim()).join(' '));

  /** O link de um card da faixa pelo rótulo. */
  const kpiLink = (root: HTMLElement, label: string) => Array.from(root.querySelectorAll('.kpi-card a') as NodeListOf<HTMLAnchorElement>)
    .find(a => a.getAttribute('aria-label')?.startsWith(label + ':'))!;

  describe('saudação', () => {
    it('cumprimenta pelo primeiro nome conforme a hora do dia', async () => {
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain(`${greetingForHour(new Date().getHours())}, Maria!`);
    });

    it('cumprimenta sem nome quando o usuário logado ainda não foi carregado', async () => {
      currentUser.set(null);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(`${greetingForHour(new Date().getHours())}!`);
    });

    it('escolhe "Bom dia", "Boa tarde" ou "Boa noite" pela hora (madrugada é noite)', () => {
      expect(greetingForHour(8)).toBe('Bom dia');
      expect(greetingForHour(13)).toBe('Boa tarde');
      expect(greetingForHour(20)).toBe('Boa noite');
      expect(greetingForHour(2)).toBe('Boa noite');
    });
  });

  describe('cabeçalho', () => {
    it('carrega os números ao abrir a tela', async () => {
      await render();
      expect(ticketsStoreFake.load).toHaveBeenCalled();
    });

    it('ao abrir (ou voltar à tela), recarrega todas as fontes, não só os totais — os stores guardam a visita anterior', async () => {
      asRequester();
      await render();
      expect(ticketsStoreFake.load).toHaveBeenCalledTimes(1);
      expect(operationFake.refresh).toHaveBeenCalledTimes(1);
      expect(myTicketsFake.reload).toHaveBeenCalledTimes(1);
    });

    it('voltando à tela com os números da visita anterior, diz "Atualizando…" (nunca "Atualizado agora") até a recarga terminar', async () => {
      asRequester();
      features.companyStatsForAll = true;
      ticketsStoreFake.statusCountsLoading.set(true);
      const fixture = await render();
      const label = () => (fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent?.trim();
      expect(label()).toContain('Atualizando…');
      expect(fixture.nativeElement.querySelector('.freshness-spinner')).not.toBeNull();

      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      expect(label()).toContain('Atualizado agora');
    });

    it('se a recarga ao voltar falha, diz que os números são de uma visita anterior', async () => {
      asRequester();
      features.companyStatsForAll = true;
      ticketsStoreFake.statusCountsFailed.set(true);
      const fixture = await render();
      expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Falha ao atualizar · números de uma visita anterior');
    });

    it('o botão de atualizar fica aria-disabled (não disabled) enquanto atualiza, pra não tirar o foco', async () => {
      asRequester();
      const fixture = await render();
      const button = fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement;
      myTicketsFake.busy.set(true);
      await fixture.whenStable();

      expect(button.disabled).toBeFalse();
      expect(button.getAttribute('aria-disabled')).toBe('true');
      ticketsStoreFake.load.calls.reset();
      button.click();
      expect(ticketsStoreFake.load).not.toHaveBeenCalled();
    });

    it('tem o botão "Guia da tela" no cabeçalho, e o guia não ocupa mais o corpo da tela', async () => {
      const fixture = await render();
      const header = fixture.nativeElement.querySelector('app-page-header') as HTMLElement;
      expect(header.querySelector('.guide-trigger')?.textContent).toContain('Guia da tela');
      expect(fixture.nativeElement.querySelector('app-screen-guide')).toBeNull();
    });

    it('diz a idade dos números e atualiza tudo na hora pelo botão, mantendo os números na tela', async () => {
      asRequester();
      const fixture = await render();
      expect(fixture.nativeElement.textContent).toContain('Atualizado agora');
      ticketsStoreFake.load.calls.reset();
      operationFake.refresh.calls.reset();
      myTicketsFake.reload.calls.reset();

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();

      expect(ticketsStoreFake.load).toHaveBeenCalledTimes(1);
      expect(operationFake.refresh).toHaveBeenCalledTimes(1);
      expect(myTicketsFake.reload).toHaveBeenCalledTimes(1);
    });

    it('anuncia ao leitor de tela só "Atualizado agora" quando uma atualização termina, nunca os números', async () => {
      const fixture = await render();
      const live = () => (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();
      expect(live()).toBe('');

      // Uma troca de agrupamento ou de filtro também recarrega, mas não é "atualização": nada é anunciado.
      ticketsStoreFake.volumeLoading.set(true);
      await fixture.whenStable();
      ticketsStoreFake.volumeLoading.set(false);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(live()).toBe('');

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.freshness-spinner')).not.toBeNull();
      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      // Limpa e escreve de novo, pra a mesma frase ser lida a cada atualização.
      await new Promise(resolve => setTimeout(resolve, 150));
      await fixture.whenStable();

      expect(live()).toBe('Atualizado agora');
      // Durante a recarga, os números continuam (nada de esqueleto no lugar).
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('12');
    });
  });

  describe('indicadores do topo (empresa toda)', () => {
    it('pra quem atende a fila, sem o agregado: atrasados primeiro (dos Alertas), depois a fila e o total', async () => {
      asAgent();
      ticketsStoreFake.criticalTicketsLoadedAtMs.set(Date.now());
      ticketsStoreFake.breachedCount.set(86);
      const fixture = await render();

      const texts = kpiTexts(fixture.nativeElement);
      expect(texts.length).toBe(3);
      expect(texts[0]).toContain('Atrasados 86');
      expect(texts[1]).toContain('Na fila 5');
      expect(texts[2]).toContain('Total 12');
      expect(fixture.nativeElement.querySelectorAll('.kpi-value')[0].classList).toContain('kpi-risk');
      expect(fixture.nativeElement.querySelectorAll('.kpi-card')[0].classList).toContain('kpi-alert-danger');
      expect(kpiLink(fixture.nativeElement, 'Atrasados').getAttribute('href')).toContain('slaStatus=3');
    });

    it('com o agregado: atrasados e sem responsável primeiro, com fundo de alerta, e a divisão por status só na barra', async () => {
      asAgent();
      features.operationOverview = true;
      const fixture = await render();

      const texts = kpiTexts(fixture.nativeElement);
      expect(texts.length).toBe(4);
      expect(texts[0]).toContain('Atrasados 2');
      expect(texts[1]).toContain('Sem responsável 3');
      expect(texts[2]).toContain('Na fila 5');
      expect(texts[3]).toContain('Total 10');
      const cards = fixture.nativeElement.querySelectorAll('.kpi-card');
      expect(cards[0].classList).toContain('kpi-alert-danger');
      expect(cards[1].classList).toContain('kpi-alert-warning');
      expect(kpiLink(fixture.nativeElement, 'Sem responsável').getAttribute('href')).toContain('unassignedOnly=true');
      expect(texts.some(text => text.includes('Fechados'))).toBeFalse();
    });

    it('zero atrasados fica neutro, e o card carrega sozinho enquanto os alertas não chegam', async () => {
      asAgent();
      const fixture = await render();
      expect(fixture.nativeElement.querySelectorAll('.kpi-card')[0].querySelector('.kpi-skeleton')).not.toBeNull();

      ticketsStoreFake.criticalTicketsLoadedAtMs.set(Date.now());
      await fixture.whenStable();
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Atrasados 0');
      expect(fixture.nativeElement.querySelectorAll('.kpi-value')[0].classList).not.toContain('kpi-risk');
      expect(fixture.nativeElement.querySelectorAll('.kpi-card')[0].classList).not.toContain('kpi-alert-danger');
    });

    it('pra quem não atende a fila, a taxa de SLA diz "em breve" (neutro, sem erro)', async () => {
      asRequester();
      features.companyStatsForAll = true;
      const fixture = await render();
      expect(kpiTexts(fixture.nativeElement)[5]).toContain('SLA cumprido Disponível em breve');
    });

    it('cada número leva à fila com o status dele e os filtros da URL', async () => {
      asAgent();
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1&priority=4');
      const fixture = await render();

      const backlog = kpiLink(fixture.nativeElement, 'Na fila').getAttribute('href')!;
      expect(backlog).toContain('/tickets/monitorar');
      expect(backlog).toContain('status=active');
      expect(backlog).toContain('sectorId=s1');
      expect(backlog).toContain('priority=4');
      expect(kpiLink(fixture.nativeElement, 'Total').getAttribute('href')).toContain('status=all');
    });

    it('carregando: esqueleto do mesmo tamanho, sem número inventado', async () => {
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsLoading.set(true);
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('.kpi-strip[aria-busy="true"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.kpi-skeleton').length).toBe(5);
    });

    it('erro de verdade: um aviso neutro com "Tentar novamente", sem vermelho', async () => {
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsFailed.set(true);
      const fixture = await render();
      ticketsStoreFake.load.calls.reset();

      const strip = fixture.nativeElement.querySelector('app-dashboard-kpi-strip') as HTMLElement;
      expect(strip.textContent).toContain('Não foi possível carregar os números.');
      expect(fixture.nativeElement.querySelector('.alert-danger, .btn-outline-danger')).toBeNull();
      (strip.querySelector('[role="alert"] button') as HTMLButtonElement).click();
      expect(ticketsStoreFake.load).toHaveBeenCalled();
    });

    it('mensagem do servidor no erro (ex.: sem permissão), não a genérica', async () => {
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsFailed.set(true);
      ticketsStoreFake.summaryError.set('Você não tem permissão para ver os números da empresa.');
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-kpi-strip').textContent).toContain('Você não tem permissão para ver os números da empresa.');
    });

    it('numa atualização que falha, os números anteriores ficam e o cabeçalho diz de quando são', async () => {
      const fixture = await render();
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Total 12');

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsFailed.set(true);
      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 150));
      await fixture.whenStable();

      // Os números certos não viram um erro; o cabeçalho avisa e o leitor de tela ouve a falha.
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Total 12');
      expect(fixture.nativeElement.querySelector('app-dashboard-kpi-strip [role="alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('.freshness-label').textContent).toContain('Falha ao atualizar · números das');
      expect(fixture.nativeElement.querySelector('.freshness [aria-live="polite"]').textContent.trim()).toBe('Não foi possível atualizar os números');
    });

    it('números grandes em pt-BR compacto, com o número completo à mão', async () => {
      ticketsStoreFake.statusCounts.set({ totalCount: 12345, openCount: 1200, inProgressCount: 0, resolvedCount: 11145, closedCount: 0, canceledCount: 0 });
      const fixture = await render();

      const total = fixture.nativeElement.querySelector('.kpi-value') as HTMLElement;
      expect(total.textContent?.trim()).toMatch(/^12,3\smil$/);
      expect(total.getAttribute('title')).toBe('12.345');
    });
  });

  describe('gráfico principal', () => {
    it('mostra a composição atual com números e percentuais, e os cancelados fora da barra pra a soma fechar', async () => {
      asAgent();
      const fixture = await render();
      // A legenda mora dentro da barra: cada fatia diz status, número e percentual.
      const items = Array.from(fixture.nativeElement.querySelectorAll('.composition-segment .segment-full') as NodeListOf<HTMLElement>)
        .map(span => span.textContent?.replace(/\s+/g, ' ').trim());

      expect(items).toEqual(['Abertos 3 · 30%', 'Andamento 2 · 20%', 'Resolvidos 4 · 40%', 'Fechados 1 · 10%']);
      expect(fixture.nativeElement.querySelector('.composition-canceled').textContent.trim()).toBe('+ 2 cancelados');
    });

    it('cada fatia leva à lista do status (teclado), e a barra tem descrição pro leitor de tela', async () => {
      asAgent();
      const fixture = await render();

      const links = Array.from(fixture.nativeElement.querySelectorAll('.composition-segment a') as NodeListOf<HTMLAnchorElement>);
      expect(links.length).toBe(4);
      expect(links[0].getAttribute('href')).toContain('status=1');
      expect(links[0].getAttribute('aria-label')).toBe('Abertos: 3 chamados, 30%. Ver a lista');
      expect(fixture.nativeElement.querySelector('.composition-bar').getAttribute('aria-label')).toContain('abertos 3 (30%)');
      expect(fixture.nativeElement.querySelector('.composition-bar').getAttribute('aria-label')).toContain('mais 2 cancelados');
    });

    it('mostra a frase de destaque quando há amostra, e nenhuma frase quando não há', async () => {
      // 7 dias até ontem com 20 por dia (índices 22–28) contra 10 por dia antes: +100%.
      ticketsStoreFake.volume.set(thirtyDays().map((p, i) => ({ ...p, count: i >= 22 && i <= 28 ? 20 : 10 })));
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.hero-insight')?.textContent).toContain('70 chamados a mais (+100%) nos 7 dias até ontem');

      ticketsStoreFake.volume.set(thirtyDays(1));
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.hero-insight')).toBeNull();
    });

    it('sem os resolvidos por período, diz uma vez que eles chegam em breve, sem série fantasma', async () => {
      const fixture = await render();
      const footnote = fixture.nativeElement.querySelector('.hero-footnote')?.textContent;
      expect(footnote).toContain('Todos os chamados da empresa · Últimos 30 dias');
      expect(footnote).toContain('Resolvidos por período e fila ao longo do tempo: disponível em breve.');
    });

    it('vazio: nenhum chamado no período', async () => {
      ticketsStoreFake.volume.set(thirtyDays(0));
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.flow-area')?.textContent).toContain('Nenhum chamado no período.');
    });

    it('erro do fluxo: aviso neutro e "Tentar novamente" na fonte certa, não o vazio', async () => {
      ticketsStoreFake.volume.set([]);
      ticketsStoreFake.volumeHasValue.set(false);
      ticketsStoreFake.volumeFailed.set(true);
      const fixture = await render();
      ticketsStoreFake.load.calls.reset();

      const area = fixture.nativeElement.querySelector('.flow-area') as HTMLElement;
      expect(area.textContent).toContain('Não foi possível carregar os chamados por período.');
      expect(area.textContent).not.toContain('Nenhum chamado');
      (area.querySelector('button') as HTMLButtonElement).click();
      expect(ticketsStoreFake.load).toHaveBeenCalled();
    });

    describe('primeiro uso (empresa sem nenhum chamado)', () => {
      beforeEach(() => {
        ticketsStoreFake.statusCounts.set({ totalCount: 0, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 });
        ticketsStoreFake.volume.set(thirtyDays(0));
      });

      it('convida quem pode abrir chamados a abrir o primeiro', async () => {
        const fixture = await render();
        expect(fixture.nativeElement.textContent).toContain('A empresa ainda não tem nenhum chamado.');
        expect(fixture.nativeElement.querySelector('.flow-area a[href="/tickets/novo"]')).not.toBeNull();
      });

      it('leva quem administra a estrutura a cadastrar departamentos e setores primeiro', async () => {
        hasPermission.and.callFake((code: string) => code === 'departments:manage');
        const fixture = await render();
        expect(fixture.nativeElement.querySelector('.flow-area a[href="/departamentos"]')).not.toBeNull();
      });
    });

    it('muda o agrupamento ao clicar em Semana', async () => {
      const fixture = await render();
      const week = Array.from(fixture.nativeElement.querySelectorAll('.hero-controls button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.trim() === 'Semana')!;
      week.click();
      expect(ticketsStoreFake.setGroupBy).toHaveBeenCalledWith('Week');
    });

    it('a tabela acessível mostra os mesmos números, leva o foco e oferece o drill-down por período', async () => {
      asAgent();
      const fixture = TestBed.createComponent(DashboardComponent);
      document.body.appendChild(fixture.nativeElement);
      await fixture.whenStable();

      const toggle = fixture.nativeElement.querySelector('button[aria-label="Ver como tabela"]') as HTMLButtonElement;
      toggle.click();
      await fixture.whenStable();

      const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
      expect(document.activeElement).toBe(table);
      expect(table.textContent).toContain('28/10/2026');
      const link = table.querySelector('a') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toContain('createdFrom=2026-09-29');
      expect(link.getAttribute('href')).toContain('createdTo=2026-09-29');
      fixture.nativeElement.remove();
    });

    it('sem o agregado no back-end, não há escolha de escopo (nem no gráfico, nem acima dos números)', async () => {
      asAgent();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.scope-row')).toBeNull();
      expect(fixture.nativeElement.querySelector('.scope-soon')).toBeNull();
    });

    it('com o agregado, Empresa e Com filtros ficam acima dos números (fora do gráfico) e trocam o escopo', async () => {
      asAgent();
      features.operationOverview = true;
      const fixture = await render();

      const group = fixture.nativeElement.querySelector('.scope-row [role="group"]') as HTMLElement;
      expect(group.getAttribute('aria-label')).toBe('Escopo dos números');
      expect(fixture.nativeElement.querySelector('app-dashboard-hero-chart .scope-soon')).toBeNull();
      const [company, filtered] = Array.from(group.querySelectorAll('button')) as HTMLButtonElement[];
      expect(company.getAttribute('aria-pressed')).toBe('true');
      filtered.click();
      expect(operationFake.setChartScope).toHaveBeenCalledWith('filtered');
    });

    it('quem não atende a fila não vê o alternador de escopo', async () => {
      asRequester();
      features.companyStatsForAll = true;
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.scope-row')).toBeNull();
      expect(fixture.nativeElement.querySelector('.scope-soon')).toBeNull();
    });
  });

  describe('filtros', () => {
    it('no escopo da empresa, a barra fica escondida, mas os filtros da URL ficam à vista com "Limpar"', async () => {
      asAgent();
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1&priority=4');
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('app-dashboard-filter-bar')).toBeNull();
      const line = fixture.nativeElement.querySelector('.applied-filters') as HTMLElement;
      expect(line.textContent).toContain('Filtros aplicados às listas: Setor: Helpdesk, Prioridade: Urgente');

      (line.querySelector('button') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/');
    });

    it('sem filtros, nenhuma linha de filtros', async () => {
      asAgent();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.applied-filters')).toBeNull();
    });

    it('sem filtros na URL, o Início abre na empresa toda, mesmo que a visita anterior tenha ficado em "Com filtros"', async () => {
      asAgent();
      features.operationOverview = true;
      operationFake.chartScope.set('filtered');
      await render();
      expect(operationFake.setChartScope).toHaveBeenCalledWith('company');
    });

    it('com um departamento na URL esperando a lista, as buscas ficam seguras (nada sai com o recorte vazio)', async () => {
      asAgent();
      features.operationOverview = true;
      operationFake.chartScope.set('filtered');
      departmentsFake.departments.set([]);
      departmentsFake.listState.set({ loading: true });
      await TestBed.inject(Router).navigateByUrl('/?departmentId=d1');
      const fixture = await render();
      expect(operationFake.holdScope).toHaveBeenCalled();
      expect(ticketsStoreFake.holdCriticalScope).toHaveBeenCalled();
      expect(operationFake.setScope).not.toHaveBeenCalled();

      // A lista chega: o recorte (os setores do departamento) vale pros números e pros Alertas.
      departmentsFake.departments.set([{ id: 'd1', name: 'TI', description: '', responsibleUserName: null, sectors: [{ id: 's1', name: 'Helpdesk', description: null }, { id: 's2', name: 'Infra', description: null }] }]);
      departmentsFake.listState.set({ loading: false });
      await fixture.whenStable();
      expect(operationFake.setScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
      expect(ticketsStoreFake.setCriticalScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
    });

    describe('anúncio ao leitor de tela', () => {
      /** Texto da região aria-live do cabeçalho, depois do atraso do "limpa e escreve de novo". */
      async function liveAfter(fixture: { whenStable(): Promise<unknown>; nativeElement: HTMLElement }): Promise<string | undefined> {
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 150));
        return (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();
      }

      it('a primeira carga não anuncia nada', async () => {
        asAgent();
        features.operationOverview = true;
        const fixture = await render();
        expect(await liveAfter(fixture)).toBe('');
      });

      it('trocar o escopo pelos botões anuncia o resumo na hora, mesmo sem nenhuma busca (Com filtros sem filtro, sem o volume do recorte)', async () => {
        asAgent();
        features = { operationOverview: true, averageTimes: false, volumeResolved: false, companyStatsForAll: false, listPeriodFilter: true };
        const fixture = await render();
        expect(await liveAfter(fixture)).toBe('');

        const filtered = Array.from(fixture.nativeElement.querySelectorAll('.scope-row button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Com filtros'))!;
        filtered.click();
        expect(operationFake.setChartScope).toHaveBeenCalledWith('filtered');
        operationFake.chartScope.set('filtered');

        expect(await liveAfter(fixture)).toBe('Números com os filtros: 2 atrasados, 5 na fila.');

        const company = Array.from(fixture.nativeElement.querySelectorAll('.scope-row button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Empresa'))!;
        company.click();
        operationFake.chartScope.set('company');
        expect(await liveAfter(fixture)).toBe('Números da empresa: 2 atrasados, 5 na fila.');
      });

      it('depois do resumo de uma troca de filtro, a atualização seguinte diz só "Atualizado agora"', async () => {
        asAgent();
        features.operationOverview = true;
        operationFake.chartScope.set('filtered');
        await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
        const fixture = await render();

        await TestBed.inject(Router).navigateByUrl('/?sectorId=s2');
        operationFake.overviewLoading.set(true);
        await fixture.whenStable();
        operationFake.overviewLoading.set(false);
        expect(await liveAfter(fixture)).toBe('Números com os filtros: 2 atrasados, 5 na fila.');

        (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
        operationFake.overviewLoading.set(true);
        await fixture.whenStable();
        operationFake.overviewLoading.set(false);
        expect(await liveAfter(fixture)).toBe('Atualizado agora');
      });
    });

    it('trocar um filtro diz ao leitor de tela um resumo curto dos números novos', async () => {
      asAgent();
      features.operationOverview = true;
      operationFake.chartScope.set('filtered');
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      const fixture = await render();
      const live = () => (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();

      await TestBed.inject(Router).navigateByUrl('/?sectorId=s2');
      operationFake.overviewLoading.set(true);
      await fixture.whenStable();
      operationFake.overviewLoading.set(false);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(live()).toBe('Números com os filtros: 2 atrasados, 5 na fila.');
    });

    it('os widgets operacionais seguem a empresa toda no escopo da empresa (os filtros valem só pras listas)', async () => {
      asAgent();
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      await render();
      expect(operationFake.setScope).toHaveBeenCalledWith({});
      expect(ticketsStoreFake.setCriticalScope).toHaveBeenCalledWith({});
    });

    it('com o back-end pronto e filtros na URL, abre no escopo "Com filtros", com a barra e os números do recorte', async () => {
      asAgent();
      features = { operationOverview: true, averageTimes: true, volumeResolved: true, companyStatsForAll: false, listPeriodFilter: false };
      operationFake.chartScope.set('filtered');
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      const fixture = await render();

      expect(operationFake.setChartScope).toHaveBeenCalledWith('filtered');
      expect(operationFake.setScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1'] }));
      // Os Alertas de SLA seguem o mesmo recorte dos números.
      expect(ticketsStoreFake.setCriticalScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1'] }));
      expect(fixture.nativeElement.querySelector('app-dashboard-filter-bar')).not.toBeNull();
      expect(kpiTexts(fixture.nativeElement)[3]).toContain('Total 10');
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Atrasados 2');
      expect(fixture.nativeElement.querySelector('#heroTitle').textContent).toContain('Operação com os filtros');
    });

    it('em "Com filtros" com período, os KPIs dizem que contam pela abertura e os grupos de baixo dizem que seguem os filtros', async () => {
      asAgent();
      features = { operationOverview: true, averageTimes: true, volumeResolved: false, companyStatsForAll: false, listPeriodFilter: true };
      operationFake.chartScope.set('filtered');
      await TestBed.inject(Router).navigateByUrl('/?period=30d');
      const fixture = await render();

      const texts = kpiTexts(fixture.nativeElement);
      expect(texts[0]).toContain('abertos no período, passaram do prazo');
      expect(texts[2]).toContain('abertos no período, ainda ativos');
      const groups = Array.from(fixture.nativeElement.querySelectorAll('app-dashboard-metric-group, app-dashboard-times') as NodeListOf<HTMLElement>);
      expect(groups.length).toBe(3);
      groups.forEach(group => expect(group.textContent).toContain('Com os filtros escolhidos acima.'));
    });

    it('com o agregado mas sem o volume do recorte, a barra e os números seguem os filtros e o fluxo fica o da empresa', async () => {
      asAgent();
      features = { operationOverview: true, averageTimes: false, volumeResolved: false, companyStatsForAll: false, listPeriodFilter: true };
      operationFake.chartScope.set('filtered');
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      const fixture = await render();

      expect(operationFake.setScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1'] }));
      expect(fixture.nativeElement.querySelector('app-dashboard-filter-bar')).not.toBeNull();
      expect(kpiTexts(fixture.nativeElement)[3]).toContain('Total 10');
      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).toContain('o fluxo ainda é o da empresa toda');
    });
  });

  describe('o que pede ação (quem atende a fila)', () => {
    it('Central de atenção "Disponível em breve" sem o agregado, ao lado dos Alertas de SLA', async () => {
      asAgent();
      const fixture = await render();

      const attention = fixture.nativeElement.querySelector('section[aria-labelledby="attentionTitle"]') as HTMLElement;
      expect(attention.textContent).toContain('Central de atenção');
      expect(attention.textContent).toContain('do mais grave ao menos grave: disponível em breve.');
      expect(fixture.nativeElement.querySelector('app-dashboard-insights')).not.toBeNull();
    });

    it('com o agregado no ar, atrasados e sem responsável vão pro topo e a Central fica com os críticos', async () => {
      asAgent();
      features.operationOverview = true;
      const fixture = await render();

      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Atrasados 2');
      expect(kpiTexts(fixture.nativeElement)[1]).toContain('Sem responsável 3');
      const central = fixture.nativeElement.querySelector('app-dashboard-metric-group') as HTMLElement;
      expect(central.textContent).toContain('Críticos');
      expect(central.textContent).not.toContain('Ativos, ninguém assumiu');
      expect(central.textContent).not.toContain('Passaram do prazo');
    });

    it('com o agregado no ar, os Alertas de SLA ficam só com a lista (os totais moram no topo e no SLA)', async () => {
      asAgent();
      features.operationOverview = true;
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-insights .sla-totals')).toBeNull();
    });

    it('uma atualização do agregado que falha mantém os números, sem alerta, e o cabeçalho avisa', async () => {
      asAgent();
      features.operationOverview = true;
      const fixture = await render();

      operationFake.overviewError.set('Não foi possível carregar os números da operação.');
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('app-dashboard-metric-group [role="alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('.freshness-label').textContent).toContain('Falha ao atualizar');
    });

    it('sem números do agregado, o erro aparece uma vez só (na faixa do topo) e recarrega o agregado', async () => {
      asAgent();
      features.operationOverview = true;
      operationFake.volume.set(null);
      operationFake.sla.set(null);
      operationFake.attention.set(null);
      operationFake.overviewError.set('Não foi possível carregar os números da operação.');
      const fixture = await render();

      const alerts = fixture.nativeElement.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBe(1);
      expect(alerts[0].closest('app-dashboard-kpi-strip')).not.toBeNull();
      // A Central e o SLA só remetem ao aviso de cima.
      const groups = Array.from(fixture.nativeElement.querySelectorAll('app-dashboard-metric-group') as NodeListOf<HTMLElement>);
      expect(groups.length).toBe(2);
      groups.forEach(group => expect(group.textContent).toContain('Indisponível no momento'));
      (alerts[0].querySelector('button') as HTMLButtonElement).click();
      expect(operationFake.reloadOverview).toHaveBeenCalled();
    });

    it('SLA detalhado e tempos esperando o back-end viram um aviso só pra linha', async () => {
      asAgent();
      const fixture = await render();
      const notices = Array.from(fixture.nativeElement.querySelectorAll('app-dashboard-notice') as NodeListOf<HTMLElement>).map(n => n.textContent ?? '');
      expect(notices.filter(text => text.includes('tempos médios')).length).toBe(1);
      expect(fixture.nativeElement.querySelector('app-dashboard-times')).toBeNull();
    });

    it('com os tempos no ar, mostra o widget de tempos', async () => {
      asAgent();
      features.averageTimes = true;
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-times')).not.toBeNull();
    });

    it('mostra os Alertas de SLA com os chamados do store e atualiza só eles pelo "Atualizar" do card', async () => {
      asAgent();
      ticketsStoreFake.criticalTickets.set([{ id: 't1', title: 'Chamado urgente' } as TicketMonitorItem]);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-insights').textContent).toContain('Chamado urgente');
      ticketsStoreFake.load.calls.reset();

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar alertas de SLA"]') as HTMLButtonElement).click();
      expect(ticketsStoreFake.reloadCritical).toHaveBeenCalledTimes(1);
      expect(ticketsStoreFake.load).not.toHaveBeenCalled();
    });

    it('no DOM (ordem do celular e do Tab), os Alertas de SLA vêm antes da Central; o desktop reordena', async () => {
      asAgent();
      const fixture = await render();
      const alerts = fixture.nativeElement.querySelector('app-dashboard-insights') as HTMLElement;
      const central = fixture.nativeElement.querySelector('section[aria-labelledby="attentionTitle"]') as HTMLElement;
      expect(alerts.compareDocumentPosition(central) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(alerts.parentElement!.classList).toContain('order-lg-2');
      expect(central.parentElement!.classList).toContain('order-lg-1');
    });

    it('quem administra sem a fila vê os atalhos de Administração (o Início não fica vazio), sem "Atualizado há"', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'departments:manage');
      ticketsStoreFake.companyStatsAvailable.set(false);
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.volumeHasValue.set(false);
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('#quickActionsTitle')).toBeNull();
      const admin = fixture.nativeElement.querySelector('section[aria-labelledby="adminTitle"]') as HTMLElement;
      const links = Array.from(admin.querySelectorAll('a')).map(a => a.getAttribute('href'));
      expect(links).toEqual(['/usuarios', '/departamentos']);
      expect(fixture.nativeElement.textContent).not.toContain('disponível em breve');
      expect(fixture.nativeElement.querySelector('.freshness')).toBeNull();
    });

    it('sem papel nenhum na tela (nem fila, nem chamados próprios, nem administração), ela não ocupa espaço', async () => {
      hasPermission.and.returnValue(false);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('#quickActionsTitle')).toBeNull();
      expect(fixture.nativeElement.querySelector('section[aria-labelledby="adminTitle"]')).toBeNull();
    });

    it('não mostra Central nem Alertas de SLA pra quem não atende a fila', async () => {
      asRequester();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-insights')).toBeNull();
      expect(fixture.nativeElement.querySelector('section[aria-labelledby="attentionTitle"]')).toBeNull();
    });
  });

  describe('quem não atende a fila', () => {
    it('sem os números da empresa liberados no back-end, "Seus chamados" vem primeiro, sem aviso de "em breve"', async () => {
      asRequester();
      ticketsStoreFake.companyStatsAvailable.set(false);
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.volumeHasValue.set(false);
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('app-dashboard-kpi-strip')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-dashboard-hero-chart')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('disponível em breve');
      expect(fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]')).not.toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Como estão os seus chamados.');
      // "Ver todos" já leva a Meus Chamados: sem o card de Ações rápidas repetindo o mesmo atalho.
      expect(fixture.nativeElement.querySelector('#quickActionsTitle')).toBeNull();
    });

    it('no primeiro uso (nenhum chamado aberto), "Seus chamados" convida a abrir o primeiro', async () => {
      asRequester();
      myTicketsFake.totalCount.set(0);
      const fixture = await render();

      const section = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      expect(section.textContent).toContain('Você ainda não abriu nenhum chamado.');
      const invite = section.querySelector('a.btn-primary') as HTMLAnchorElement;
      expect(invite.textContent).toContain('Abrir o primeiro chamado');
      expect(invite.getAttribute('href')).toBe('/tickets/novo');
      expect(section.querySelector('app-stat-card')).toBeNull();
    });

    it('com os números liberados, o drill-down abre Meus Chamados e diz quantos deles a pessoa vê', async () => {
      asRequester();
      features.companyStatsForAll = true;
      const fixture = await render();

      const link = kpiLink(fixture.nativeElement, 'Na fila');
      expect(link.getAttribute('href')).toBe('/tickets');
      expect(link.closest('.kpi-card')?.textContent).toContain('Você tem acesso a 3 dos 5 chamados');
      expect(kpiLink(fixture.nativeElement, 'Resolvidos').getAttribute('href')).toBe('/tickets?status=finished');
    });
  });

  describe('seus chamados', () => {
    it('mostra os próprios chamados nos grupos de Meus Chamados: cada card com o número da lista que abre', async () => {
      asRequester();
      const fixture = await render();

      const section = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      expect(section.querySelector('h2')?.textContent).toContain('Seus chamados');
      const values = Array.from(section.querySelectorAll('.stat-value') as NodeListOf<HTMLElement>).map(v => v.textContent?.trim());
      // Em aberto = ativos (3, a lista "Em aberto"); Encerrados = resolvidos, fechados e cancelados (5); Todos = 8.
      expect(values).toEqual(['3', '5', '8']);
      const links = Array.from(section.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>).map(a => a.getAttribute('href'));
      expect(links).toEqual(['/tickets', '/tickets?status=finished', '/tickets?status=all']);
      // A divisão por status fica à vista, sem esconder a diferença.
      expect(section.textContent).toContain('2 abertos, 1 em andamento');
      expect(section.textContent).toContain('5 resolvidos ou fechados, 0 cancelados');
      expect(links.length).toBe(3);
      expect((section.querySelector('a.stretched-link') as HTMLAnchorElement).getAttribute('aria-label')).toBe('Em aberto: 3, 2 abertos, 1 em andamento. Ver em Meus Chamados');
    });

    it('não mostra o bloco pra quem atende a fila, nem pede o resumo à API (o store nem é criado)', async () => {
      hasPermission.and.callFake((code: string) => code === 'tickets:view-own' || code === 'tickets:manage');
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]')).toBeNull();
      expect(myTicketsCreated).toBeFalse();
    });

    it('pra quem abre chamados, o store é criado (busca o resumo)', async () => {
      asRequester();
      await render();
      expect(myTicketsCreated).toBeTrue();
    });

    it('numa recarga, os números ficam como estão (sem spinner), e o cabeçalho gira o indicador', async () => {
      asRequester();
      const fixture = await render();
      myTicketsFake.busy.set(true);
      await fixture.whenStable();

      const section = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      const values = Array.from(section.querySelectorAll('.stat-value') as NodeListOf<HTMLElement>).map(v => v.textContent?.trim());
      expect(values).toEqual(['3', '5', '8']);
      expect(section.querySelector('.spinner-border')).toBeNull();
      expect(fixture.nativeElement.querySelector('.freshness-spinner')).not.toBeNull();
    });

    it('uma atualização que falha mantém os números e o cabeçalho diz "Falha ao atualizar", sem aviso no bloco', async () => {
      asRequester();
      myTicketsFake.stale.set(true);
      const fixture = await render();

      const section = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      expect(section.querySelector('[role="alert"]')).toBeNull();
      expect(section.textContent).toContain('2 abertos, 1 em andamento');
      expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Falha ao atualizar');
    });

    it('falha: aviso neutro com "Tentar novamente"', async () => {
      asRequester();
      myTicketsFake.failed.set(true);
      const fixture = await render();

      const retry = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"] [role="alert"] button') as HTMLButtonElement;
      retry.click();
      expect(myTicketsFake.reload).toHaveBeenCalled();
    });
  });

  describe('Ações rápidas', () => {
    it('mostra Novo Chamado, Meus Chamados e Atribuídos a mim pra quem atende a fila sem ser administrativo', async () => {
      asAgent();
      const fixture = await render();
      const links = Array.from(fixture.nativeElement.querySelectorAll('.quick-link') as NodeListOf<HTMLElement>).map(a => a.textContent ?? '');
      expect(links.some(t => t.includes('Meus Chamados'))).toBeTrue();
      expect(links.some(t => t.includes('Atribuídos a mim'))).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Novo Chamado');
    });

    it('não mostra "Atribuídos a mim" pra quem não atende a fila', async () => {
      const fixture = await render();
      expect(fixture.nativeElement.textContent).not.toContain('Atribuídos a mim');
    });

    it('administrativo que atende a fila vê "Atribuídos a mim", sem Novo Chamado nem Meus Chamados', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'tickets:manage');
      const fixture = await render();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Atribuídos a mim');
      expect(text).not.toContain('Novo Chamado');
      expect(text).not.toContain('Meus Chamados');
    });

    it('administrativo sem tickets:manage não vê o card vazio nem atalho pro Monitorar', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read');
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('a[href^="/tickets/monitorar"]')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Ações rápidas');
    });

    it('Novo Chamado é um link de verdade (<a>), pra funcionar com Ctrl+clique/nova aba', async () => {
      const fixture = await render();
      const link = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).find(a => a.textContent?.includes('Novo Chamado'));
      expect(link).toBeTruthy();
    });
  });

  it('usa uma hierarquia de títulos sem saltos: h1 na saudação e h2 nos blocos', async () => {
    asAgent();
    const fixture = await render();
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h1, h2, h3, h4') as NodeListOf<HTMLElement>).map(h => h.tagName);
    expect(headings[0]).toBe('H1');
    expect(headings.slice(1).every(tag => tag === 'H2')).toBeTrue();
  });

  describe('"Atribuir" nos Alertas de SLA', () => {
    const unassigned = {
      id: 't7', title: 'VPN caindo', sectorName: 'Infra', assignedToUserId: null, assignedToName: null,
      dueAtUtc: new Date(Date.now() + 3_600_000).toISOString(), slaStatus: 2
    } as unknown as TicketMonitorItem;

    /** Abre o Início como quem atende a fila, com um alerta sem responsável, e clica em "Atribuir". */
    async function openAssignDialog() {
      asAgent();
      ticketsStoreFake.criticalTickets.set([unassigned]);
      const fixture = await render();
      (fixture.nativeElement.querySelector('button[aria-label="Atribuir responsável ao chamado VPN caindo"]') as HTMLButtonElement).click();
      await fixture.whenStable();
      return fixture;
    }

    it('abre o diálogo de atribuição com a busca limpa', async () => {
      const fixture = await openAssignDialog();
      expect(ticketsStoreFake.resetAssignment).toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('app-ticket-assign-dialog')).not.toBeNull();
    });

    it('ao confirmar, atribui pelo store e, no sucesso, avisa e fecha o diálogo', async () => {
      const fixture = await openAssignDialog();
      const dialog = fixture.debugElement.query(debug => debug.name === 'app-ticket-assign-dialog');

      dialog.componentInstance.confirm.emit({ userId: 'u9', name: 'Ana Lima' });
      expect(ticketsStoreFake.assignResponsible).toHaveBeenCalledWith('t7', 'u9', jasmine.any(Function));

      ticketsStoreFake.assignResponsible.calls.mostRecent().args[2]();
      await fixture.whenStable();
      expect(toastServiceFake.show).toHaveBeenCalledWith('Ana Lima agora é o responsável.');
      expect(fixture.nativeElement.querySelector('app-ticket-assign-dialog')).toBeNull();
    });

    it('fechar sem atribuir limpa a busca e não chama o store', async () => {
      const fixture = await openAssignDialog();
      const dialog = fixture.debugElement.query(debug => debug.name === 'app-ticket-assign-dialog');
      ticketsStoreFake.resetAssignment.calls.reset();

      dialog.componentInstance.closed.emit();
      await fixture.whenStable();

      expect(ticketsStoreFake.assignResponsible).not.toHaveBeenCalled();
      expect(ticketsStoreFake.resetAssignment).toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('app-ticket-assign-dialog')).toBeNull();
    });
  });

  it('calcula a comparação e a taxa de SLA sem inventar número', () => {
    expect(countTrend(12, 10)).toBe('2 a mais que no período anterior');
    expect(countTrend(8, 10)).toBe('2 a menos que no período anterior');
    expect(countTrend(10, 10)).toBe('igual ao período anterior');
    expect(countTrend(10, undefined)).toBeNull();
    expect(slaRate(7, 1)).toBe(88);
    expect(slaRate(0, 0)).toBeNull();
  });
});
