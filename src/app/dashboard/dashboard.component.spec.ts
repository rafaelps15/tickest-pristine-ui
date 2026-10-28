import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { DashboardComponent, greetingForHour } from './dashboard.component';
import { MyTicketsSummaryStore, TicketSummaryStore, TicketDashboardStore, TicketAssigneesStore, TicketAssignee, TicketAverageTimes, TicketDashboardScope, TicketDashboardVolume, TicketDashboardSla, TicketDashboardAttention, TicketVolumeGrouping, TicketVolumePoint, TicketMonitorItem } from '../tickets';
import { DepartmentsStore, Department } from '../departments';
import { SessionService, ToastService } from '../shared';

describe('DashboardComponent', () => {
  /** Store falso dos widgets operacionais (agregado, tempos médios e gráfico), com signals reais. */
  function createOperationStoreFake() {
    return {
      volume: signal<TicketDashboardVolume | null>({ total: 10, open: 3, inProgress: 2, resolved: 4, closed: 1, canceled: 0, backlog: 5 }),
      sla: signal<TicketDashboardSla | null>({ onTime: 3, atRisk: 1, breached: 2, met: 7, missed: 1, notApplicable: 0 }),
      attention: signal<TicketDashboardAttention | null>({ overdue: 2, critical: 1, unassigned: 3 }),
      overviewLoading: signal(false),
      overviewError: signal<string | null>(null),
      times: signal<TicketAverageTimes | null>({
        firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
        resolution: { averageMinutes: null, medianMinutes: null, sampleSize: 4 },
        minimumSample: 5
      }),
      timesLoading: signal(false),
      timesError: signal<string | null>(null),
      trend: signal<TicketVolumePoint[]>([{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]),
      trendLoading: signal(false),
      trendError: signal<string | null>(null),
      groupBy: signal<TicketVolumeGrouping>('Day'),
      setScope: jasmine.createSpy('setScope'),
      setGroupBy: jasmine.createSpy('setGroupBy'),
      reloadOverview: jasmine.createSpy('reloadOverview'),
      reloadTimes: jasmine.createSpy('reloadTimes'),
      reloadTrend: jasmine.createSpy('reloadTrend')
    };
  }

  /** Cria um store de resumo falso com signals reais, para o template reagir como no store verdadeiro. */
  function createTicketsStoreFake() {
    return {
      summaryError: signal<string | null>(null),
      statusCountsLoading: signal(false),
      volumeLoading: signal(false),
      statusCountsFailed: signal(false),
      volumeFailed: signal(false),
      total: signal(10),
      openCount: signal(3),
      inProgressCount: signal(2),
      resolvedCount: signal(4),
      closedCount: signal(1),
      canceledCount: signal(0),
      groupBy: signal<TicketVolumeGrouping>('Day'),
      volume: signal<TicketVolumePoint[]>([
        { periodStart: '2026-01-05', count: 2 },
        { periodStart: '2026-01-06', count: 5 }
      ]),
      load: jasmine.createSpy('load'),
      setGroupBy: jasmine.createSpy('setGroupBy'),
      criticalTickets: signal<TicketMonitorItem[]>([]),
      breachedCount: signal(0),
      atRiskCount: signal(0),
      clockOffsetMs: signal(0),
      criticalTicketsLoadedAtMs: signal<number | null>(null),
      criticalTicketsRefreshing: signal(false),
      reloadCritical: jasmine.createSpy('reloadCritical'),
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

  type CurrentUserFake = { firstName: string; roles: { name: string }[] } | null;

  let operationFake: ReturnType<typeof createOperationStoreFake>;
  let departmentsFake: { departments: ReturnType<typeof signal<Department[]>>; listState: ReturnType<typeof signal<{ loading: boolean }>> };
  let assigneesFake: { assignees: ReturnType<typeof signal<TicketAssignee[]>>; total: ReturnType<typeof signal<number>> };
  let ticketsStoreFake: ReturnType<typeof createTicketsStoreFake>;
  let hasPermission: jasmine.Spy;
  let myTicketsFake: {
    openCount: ReturnType<typeof signal<number | null>>; inProgressCount: ReturnType<typeof signal<number | null>>;
    resolvedCount: ReturnType<typeof signal<number | null>>; loading: ReturnType<typeof signal<boolean>>;
    failed: ReturnType<typeof signal<boolean>>; reload: jasmine.Spy;
  };
  let currentUser: ReturnType<typeof signal<CurrentUserFake>>;
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    ticketsStoreFake = createTicketsStoreFake();
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);
    myTicketsFake = {
      openCount: signal<number | null>(2), inProgressCount: signal<number | null>(1), resolvedCount: signal<number | null>(5),
      loading: signal(false), failed: signal(false), reload: jasmine.createSpy('reload')
    };
    currentUser = signal<CurrentUserFake>({ firstName: 'Maria', roles: [{ name: 'Colaborador' }] });
    toastServiceFake = { show: jasmine.createSpy('show') };

    operationFake = createOperationStoreFake();
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
        { provide: MyTicketsSummaryStore, useValue: myTicketsFake },
        { provide: SessionService, useValue: { hasPermission, currentUser } },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  describe('saudação', () => {
    it('cumprimenta pelo primeiro nome conforme a hora do dia', async () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      const expected = `${greetingForHour(new Date().getHours())}, Maria!`;
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain(expected);
    });

    it('cumprimenta sem nome quando o usuário logado ainda não foi carregado', async () => {
      currentUser.set(null);
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(`${greetingForHour(new Date().getHours())}!`);
    });

    it('escolhe "Bom dia", "Boa tarde" ou "Boa noite" pela hora (madrugada é noite)', () => {
      expect(greetingForHour(5)).toBe('Bom dia');
      expect(greetingForHour(11)).toBe('Bom dia');
      expect(greetingForHour(12)).toBe('Boa tarde');
      expect(greetingForHour(17)).toBe('Boa tarde');
      expect(greetingForHour(18)).toBe('Boa noite');
      expect(greetingForHour(2)).toBe('Boa noite');
    });
  });

  it('carrega o resumo da empresa ao inicializar, para qualquer papel', async () => {
    currentUser.set({ firstName: 'Carlos', roles: [{ name: 'Administrador' }] });
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(ticketsStoreFake.load).toHaveBeenCalled();
  });

  it('mostra o alerta de erro quando o resumo da empresa falhar', async () => {
    ticketsStoreFake.summaryError.set('Erro ao carregar o resumo dos chamados');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o resumo dos chamados');
  });

  it('recarrega o resumo ao clicar em "Tentar novamente" no alerta de erro', async () => {
    ticketsStoreFake.summaryError.set('Erro ao carregar o resumo dos chamados');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(ticketsStoreFake.load).toHaveBeenCalled();
  });

  it('mostra "—" (indisponível) nos cards quando os totais falham, em vez de um 0 que passaria por dado real', async () => {
    ticketsStoreFake.statusCountsFailed.set(true);
    ticketsStoreFake.total.set(0);
    ticketsStoreFake.openCount.set(0);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const values = Array.from(fixture.nativeElement.querySelectorAll('.stat-value') as NodeListOf<HTMLElement>)
      .map(v => v.textContent?.trim());
    expect(values.length).toBe(4);
    expect(values.every(v => v === '—indisponível')).toBeTrue();
  });

  it('mostra erro com "Tentar novamente" no gráfico quando o volume falha, não o vazio "nenhum ticket"', async () => {
    ticketsStoreFake.volumeFailed.set(true);
    ticketsStoreFake.volume.set([]);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const chart = fixture.nativeElement.querySelector('.chart-container') as HTMLElement;
    expect(chart.textContent).toContain('Não foi possível carregar o volume de chamados.');
    expect(chart.textContent).not.toContain('Nenhum chamado aberto');
    (chart.querySelector('button') as HTMLButtonElement).click();
    expect(ticketsStoreFake.load).toHaveBeenCalled();
  });

  it('mostra um spinner nos cards de estatística, em vez dos números, enquanto o resumo carrega', async () => {
    ticketsStoreFake.statusCountsLoading.set(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('10');
    expect(fixture.nativeElement.querySelectorAll('.spinner-border').length).toBeGreaterThanOrEqual(4);
  });

  it('não mostra spinner nos cards de estatística quando só o volume está carregando (recursos independentes)', async () => {
    ticketsStoreFake.volumeLoading.set(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('10');
  });

  it('mostra uma mensagem de vazio no gráfico quando não há tickets abertos no período', async () => {
    ticketsStoreFake.volume.set([]);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado aberto neste período ainda.');
  });

  describe('primeiro uso (empresa sem nenhum ticket)', () => {
    beforeEach(() => {
      ticketsStoreFake.total.set(0);
      ticketsStoreFake.volume.set([]);
    });

    it('convida quem pode abrir chamados a abrir o primeiro ticket, em vez do gráfico vazio', async () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      const chart = fixture.nativeElement.querySelector('.chart-container') as HTMLElement;
      expect(chart.textContent).toContain('A empresa ainda não tem nenhum chamado.');
      expect(chart.querySelector('a')?.getAttribute('href')).toBe('/tickets/novo');
      expect(chart.textContent).not.toContain('Nenhum chamado aberto neste período');
    });

    it('leva quem administra a estrutura a cadastrar departamentos e setores primeiro', async () => {
      hasPermission.and.callFake((code: string) => code === 'departments:manage');
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      const cta = fixture.nativeElement.querySelector('.chart-container a') as HTMLAnchorElement;
      expect(cta.textContent?.trim()).toBe('Cadastrar departamentos e setores');
      expect(cta.getAttribute('href')).toBe('/departamentos');
    });

    it('não mostra o convite enquanto os totais carregam ou quando falharam (0 ali não é "empresa nova")', async () => {
      ticketsStoreFake.statusCountsFailed.set(true);
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).not.toContain('A empresa ainda não tem nenhum chamado.');
    });
  });

  it('com tickets:manage, troca os cards da empresa pelo Volume filtrável, cada card levando à fila com o mesmo status', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const volume = fixture.nativeElement.querySelector('app-dashboard-metric-group[title="Volume"]') as HTMLElement;
    const links = Array.from(volume.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>);
    expect(links).toHaveSize(5);
    expect(links.some(a => a.getAttribute('href')?.includes('status=active'))).toBeTrue();
    expect(links.some(a => a.getAttribute('href')?.includes('status=2'))).toBeTrue();
    const companyCards = Array.from(fixture.nativeElement.querySelectorAll('app-stat-card') as NodeListOf<HTMLElement>)
      .filter(card => card.textContent?.includes('Total de Chamados'));
    expect(companyCards.length).toBe(0);
    expect(volume.textContent).toContain('Ver na fila');
  });

  it('inclui a contagem atual no aria-label dos cards operacionais, pra quem usa leitor de tela saber "quantos" antes de entrar', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const labels = Array.from(fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>).map(a => a.getAttribute('aria-label'));
    expect(labels).toContain('Ver 5 chamados no backlog na fila de monitoramento');
    expect(labels).toContain('Ver 2 chamados com o prazo vencido na fila de monitoramento');
    expect(labels).toContain('Ver 3 chamados ativos sem responsável na fila de monitoramento');
  });

  it('leva o recorte da URL pros widgets e pro drill-down (setor, prioridade e responsável)', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    await TestBed.inject(Router).navigateByUrl('/?sectorId=s1&priority=4&assignee=none');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const scope: TicketDashboardScope = { sectorIds: ['s1'], priority: 4, assignee: 'none', assignedToUserId: undefined, from: undefined, to: undefined };
    expect(operationFake.setScope).toHaveBeenCalledWith(scope);
    const backlog = Array.from(fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>)
      .find(a => a.getAttribute('aria-label')?.includes('backlog'))!;
    const href = backlog.getAttribute('href')!;
    expect(href).toContain('sectorId=s1');
    expect(href).toContain('priority=4');
    expect(href).toContain('unassignedOnly=true');
    expect(href).toContain('status=active');
    // Chip do filtro ativo, com o nome do setor.
    expect(fixture.nativeElement.textContent).toContain('Setor: Helpdesk');
  });

  it('o agregado com erro mostra um aviso só (não um por grupo), sem derrubar os tempos médios, e recarrega só ele', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    operationFake.sla.set(null);
    operationFake.overviewError.set('Não foi possível carregar os números da operação.');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const alerts = Array.from(fixture.nativeElement.querySelectorAll('[role="alert"]') as NodeListOf<HTMLElement>)
      .filter(alert => alert.textContent?.includes('números da operação'));
    expect(alerts.length).toBe(1);
    const sla = fixture.nativeElement.querySelector('app-dashboard-metric-group[title="SLA"]') as HTMLElement;
    expect(sla.textContent).toContain('Indisponível no momento');
    (alerts[0].querySelector('button') as HTMLButtonElement).click();
    expect(operationFake.reloadOverview).toHaveBeenCalled();
    expect(operationFake.reloadTimes).not.toHaveBeenCalled();
    // Os tempos médios continuam com os números.
    expect(fixture.nativeElement.querySelector('app-dashboard-times').textContent).toContain('1 h 15 min');
  });

  it('traduz o departamento nos setores dele e o período pronto em datas, e leva os dois pro drill-down', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    await TestBed.inject(Router).navigateByUrl('/?departmentId=d1&period=7d');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const scope = operationFake.setScope.calls.mostRecent().args[0] as TicketDashboardScope;
    expect(scope.sectorIds).toEqual(['s1', 's2']);
    expect(scope.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(scope.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const backlog = Array.from(fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>)
      .find(a => a.getAttribute('aria-label')?.includes('backlog'))!;
    const href = backlog.getAttribute('href')!;
    expect(href).toContain('sectorId=s1&sectorId=s2');
    expect(href).toContain(`createdFrom=${scope.from}`);
    expect(fixture.nativeElement.textContent).toContain('Departamento: TI');
    expect(fixture.nativeElement.textContent).toContain('Últimos 7 dias');
  });

  it('espera os departamentos carregarem antes de mandar um recorte por departamento', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    departmentsFake.departments.set([]);
    departmentsFake.listState.set({ loading: true });
    await TestBed.inject(Router).navigateByUrl('/?departmentId=d1');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(operationFake.setScope).not.toHaveBeenCalled();
  });

  it('mostra "Aguardando" na Central quando o agregado manda os contadores', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    operationFake.attention.set({ overdue: 2, critical: 1, unassigned: 3, awaitingAgent: 6, awaitingRequester: 4 });
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const attention = fixture.nativeElement.querySelector('app-dashboard-metric-group[title="Central de atenção"]') as HTMLElement;
    expect(attention.textContent).toContain('Aguardando a equipe');
    expect(attention.textContent).toContain('Aguardando o solicitante');
    const link = Array.from(attention.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>)
      .find(a => a.getAttribute('aria-label')?.includes('esperando resposta da equipe'))!;
    expect(link.getAttribute('href')).toContain('awaiting=2');
  });

  it('sem os contadores de "aguardando", a Central mostra só os três de hoje', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const attention = fixture.nativeElement.querySelector('app-dashboard-metric-group[title="Central de atenção"]') as HTMLElement;
    expect(attention.querySelectorAll('a.stretched-link').length).toBe(3);
  });

  it('com tickets:manage, o gráfico usa o Criados x Resolvidos do recorte, com a coluna de resolvidos na tabela', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Criados x Resolvidos');
    expect(fixture.nativeElement.textContent).toContain('com os filtros acima');
    (Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Ver como tabela'))!).click();
    await fixture.whenStable();
    const headers = Array.from(fixture.nativeElement.querySelectorAll('table thead th') as NodeListOf<HTMLElement>).map(th => th.textContent?.trim());
    expect(headers).toEqual(['Período', 'Chamados criados', 'Resolvidos']);
  });

  it('com tickets:manage, o "Tentar novamente" do gráfico recarrega o gráfico do recorte', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    operationFake.trend.set([]);
    operationFake.trendError.set('Não foi possível carregar o volume de chamados.');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.chart-container button') as HTMLButtonElement).click();
    expect(operationFake.reloadTrend).toHaveBeenCalled();
    expect(ticketsStoreFake.load).toHaveBeenCalledTimes(1);
  });

  it('sem tickets:manage, não mostra os widgets operacionais nem a barra de filtros', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-dashboard-filter-bar')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-dashboard-metric-group')).toBeNull();
  });

  it('não linka os cards de status sem a permissão tickets:manage', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('a.stretched-link')).toHaveSize(0);
    expect(fixture.nativeElement.textContent).not.toContain('Ver na fila');
  });

  it('renderiza os cards de estatísticas com os valores do store', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('10');
    expect(text).toContain('3');
    expect(text).toContain('2');
    expect(text).toContain('4');
  });

  it('explica a diferença entre o Total e os 3 cards visíveis quando há fechados/cancelados', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Inclui 1 fechado');
  });

  it('não mostra a legenda de detalhamento quando não há fechados nem cancelados', async () => {
    ticketsStoreFake.closedCount.set(0);
    ticketsStoreFake.canceledCount.set(0);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Inclui');
    expect(fixture.nativeElement.textContent).toContain('Todos os status');
  });

  it('diz no título do gráfico que conta tickets criados e qual o intervalo, conforme o agrupamento', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const header = () => (fixture.nativeElement.querySelector('.chart-container')!.closest('.card') as HTMLElement)
      .querySelector('.card-header')!.textContent;
    expect(header()).toContain('Chamados criados');
    expect(header()).toContain('Últimos 2 dias');

    ticketsStoreFake.groupBy.set('Week');
    ticketsStoreFake.volume.set([]);
    await fixture.whenStable();
    expect(header()).toContain('Últimas 12 semanas');
    // O intervalo é anunciado ao trocar o agrupamento.
    expect(fixture.nativeElement.querySelector('.card-header [aria-live="polite"]').textContent.trim()).toBe('Últimas 12 semanas');
  });

  it('usa uma hierarquia de títulos sem saltos: h1 na saudação, h2 nas seções e h3 só dentro delas', async () => {
    hasPermission.and.returnValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const levels = Array.from(fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>)
      .map(h => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    expect(levels.slice(1).every((level, i) => level >= 2 && level <= levels[i] + 1)).toBeTrue();
  });

  it('pluraliza corretamente a legenda de detalhamento quando há mais de um fechado e mais de um cancelado', async () => {
    ticketsStoreFake.closedCount.set(2);
    ticketsStoreFake.canceledCount.set(3);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Inclui 2 fechados e 3 cancelados');
  });

  it('muda o agrupamento do gráfico ao clicar em Semana/Mês', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const monthButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Mês');
    monthButton?.click();

    expect(ticketsStoreFake.setGroupBy).toHaveBeenCalledWith('Month');
  });

  it('mostra a tabela acessível com o volume por período ao alternar "Ver como tabela"', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const toggleButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Ver como tabela'));
    toggleButton?.click();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Quantidade de chamados criados por período');
    expect(text).toContain('05/01');
    expect(text).toContain('5');
    // O foco vai pra tabela, pro leitor de tela anunciar a troca (antes o conteúdo mudava em silêncio).
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('table'));
  });

  it('mostra Novo Ticket, Meus Tickets E Tickets sem responsável pra quem não é administrativo mas tem tickets:manage (ex. Atendente)', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Novo Chamado');
    expect(text).toContain('Meus Chamados');
    expect(text).toContain('Chamados sem responsável');
  });

  it('não mostra o atalho "Tickets sem responsável" pra quem não tem a permissão tickets:manage (ex. Solicitante)', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Chamados sem responsável');
  });

  it('troca Novo Chamado/Meus Chamados por "Chamados sem responsável" pra quem é administrativo e gerencia a fila', async () => {
    hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Chamados sem responsável');
    expect(text).not.toContain('Novo Chamado');
    expect(text).not.toContain('Meus Chamados');
  });

  it('não mostra o atalho pro Monitorar (nem o card vazio) pra administrativo sem tickets:manage, que a rota recusaria', async () => {
    hasPermission.and.callFake((code: string) => code === 'users:read');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a[href^="/tickets/monitorar"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Ações Rápidas');
  });

  it('mantém Ações Rápidas restrito a atalhos contextuais ao dashboard, não a um menu de administração duplicado', async () => {
    hasPermission.and.returnValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Monitorar Chamados');
    expect(text).not.toContain('Gestão de Usuários');
    expect(text).not.toContain('Funções');
    expect(text).not.toContain('Departamentos e setores');
  });

  it('os atalhos de Ações Rápidas são links de verdade (<a>), não botões, pra funcionar com Ctrl+clique/nova aba', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const novoTicketLink = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .find(a => a.textContent?.includes('Novo Chamado'));

    expect(novoTicketLink).withContext('o atalho "Novo Ticket" deve ser <a>, não <button>').toBeTruthy();
  });

  it('não mostra o card de Alertas de SLA pra quem não tem a permissão tickets:manage', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-dashboard-insights')).toBeNull();
  });

  it('mostra o card de Alertas de SLA, com os chamados em risco do store, pra quem tem tickets:manage', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    ticketsStoreFake.criticalTickets.set([{ id: 't1', title: 'Chamado urgente' } as TicketMonitorItem]);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const insights = fixture.nativeElement.querySelector('app-dashboard-insights');
    expect(insights).toBeTruthy();
    expect(insights.textContent).toContain('Chamado urgente');
  });

  it('atualiza só os alertas de SLA (reloadCritical) ao pedir "Atualizar" no card, sem recarregar o resto', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();
    ticketsStoreFake.load.calls.reset();

    (fixture.nativeElement.querySelector('button[aria-label="Atualizar alertas de SLA"]') as HTMLButtonElement).click();

    expect(ticketsStoreFake.reloadCritical).toHaveBeenCalledTimes(1);
    expect(ticketsStoreFake.load).not.toHaveBeenCalled();
  });

  describe('"Atribuir" nos Alertas de SLA', () => {
    const unassigned = {
      id: 't7', title: 'VPN caindo', sectorName: 'Infra', assignedToUserId: null, assignedToName: null,
      dueAtUtc: new Date(Date.now() + 3_600_000).toISOString(), slaStatus: 2
    } as unknown as TicketMonitorItem;

    /** Abre o Dashboard como quem atende a fila, com um alerta sem responsável, e clica em "Atribuir". */
    async function openAssignDialog() {
      hasPermission.and.callFake((code: string) => code === 'tickets:manage');
      ticketsStoreFake.criticalTickets.set([unassigned]);
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();
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

  describe('seus chamados', () => {
    it('mostra os próprios chamados por situação, ligando a Meus Chamados, pra quem abre chamados e não atende a fila', async () => {
      hasPermission.and.callFake((code: string) => code === 'tickets:view-own');
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      const section = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      expect(section.querySelector('h2')?.textContent).toContain('Seus chamados');
      const values = Array.from(section.querySelectorAll('.stat-value') as NodeListOf<HTMLElement>).map(v => v.textContent?.trim());
      expect(values).toEqual(['2', '1', '5']);
      const links = Array.from(section.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>).map(a => a.getAttribute('href'));
      expect(links).toEqual(['/tickets', '/tickets', '/tickets?status=finished']);
      expect(fixture.nativeElement.textContent).toContain('Toda a empresa');
    });

    it('não mostra o bloco pra quem atende a fila', async () => {
      hasPermission.and.callFake((code: string) => code === 'tickets:view-own' || code === 'tickets:manage');
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]')).toBeNull();
    });

    it('mostra "—" e "Tentar novamente" quando o resumo falha', async () => {
      hasPermission.and.callFake((code: string) => code === 'tickets:view-own');
      myTicketsFake.failed.set(true);
      const fixture = TestBed.createComponent(DashboardComponent);
      await fixture.whenStable();

      const retry = Array.from(fixture.nativeElement.querySelectorAll('section button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Tentar novamente'));
      retry!.click();
      expect(myTicketsFake.reload).toHaveBeenCalled();
    });
  });
});
