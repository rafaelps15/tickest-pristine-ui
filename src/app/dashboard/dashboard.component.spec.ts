import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TicketSummaryStore, TicketVolumeGrouping, TicketVolumePoint, TicketMonitorItem } from '../tickets';
import { SessionService } from '../shared';

describe('DashboardComponent', () => {
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
      criticalTicketsLoading: signal(false),
      criticalTicketsError: signal<string | null>(null)
    };
  }

  type CurrentUserFake = { firstName: string; roles: { name: string }[] } | null;

  let ticketsStoreFake: ReturnType<typeof createTicketsStoreFake>;
  let hasPermission: jasmine.Spy;
  let currentUser: ReturnType<typeof signal<CurrentUserFake>>;

  beforeEach(async () => {
    ticketsStoreFake = createTicketsStoreFake();
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);
    currentUser = signal<CurrentUserFake>({ firstName: 'Maria', roles: [{ name: 'Colaborador' }] });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketSummaryStore, useValue: ticketsStoreFake },
        { provide: SessionService, useValue: { hasPermission, currentUser } }
      ]
    }).compileComponents();
  });

  it('dá boas-vindas ao usuário logado pelo primeiro nome', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Seja bem-vindo(a), Maria!');
  });

  it('mostra uma saudação genérica quando o usuário logado ainda não foi carregado', async () => {
    currentUser.set(null);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Seja bem-vindo(a)!');
  });

  it('carrega o resumo da empresa ao inicializar, para qualquer papel', async () => {
    currentUser.set({ firstName: 'Carlos', roles: [{ name: 'Administrador' }] });
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(ticketsStoreFake.load).toHaveBeenCalled();
  });

  it('mostra o alerta de erro quando o resumo da empresa falhar', async () => {
    ticketsStoreFake.summaryError.set('Erro ao carregar o resumo dos tickets');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o resumo dos tickets');
  });

  it('recarrega o resumo ao clicar em "Tentar novamente" no alerta de erro', async () => {
    ticketsStoreFake.summaryError.set('Erro ao carregar o resumo dos tickets');
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
    expect(chart.textContent).toContain('Não foi possível carregar o volume de tickets.');
    expect(chart.textContent).not.toContain('Nenhum ticket aberto');
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

    expect(fixture.nativeElement.textContent).toContain('Nenhum ticket aberto neste período ainda.');
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
      expect(chart.textContent).toContain('A empresa ainda não tem nenhum ticket.');
      expect(chart.querySelector('a')?.getAttribute('href')).toBe('/tickets/novo');
      expect(chart.textContent).not.toContain('Nenhum ticket aberto neste período');
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

      expect(fixture.nativeElement.textContent).not.toContain('A empresa ainda não tem nenhum ticket.');
    });
  });

  it('linka os cards de status para a fila de monitoramento, já filtrada pelo mesmo status, com a permissão tickets:manage', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>);
    expect(links).toHaveSize(3);
    expect(links.some(a => a.getAttribute('href')?.includes('status=1'))).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('toque para ver na fila');
  });

  it('inclui a contagem atual no aria-label dos cards de status, pra quem usa leitor de tela saber "quantos" antes de entrar', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>);
    expect(links.some(a => a.getAttribute('aria-label') === 'Ver 3 tickets em aberto na fila de monitoramento')).toBeTrue();
    expect(links.some(a => a.getAttribute('aria-label') === 'Ver 2 tickets em andamento na fila de monitoramento')).toBeTrue();
    expect(links.some(a => a.getAttribute('aria-label') === 'Ver 4 tickets resolvidos na fila de monitoramento')).toBeTrue();
  });

  it('não linka os cards de status sem a permissão tickets:manage', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('a.stretched-link')).toHaveSize(0);
    expect(fixture.nativeElement.textContent).not.toContain('toque para ver na fila');
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

    expect(fixture.nativeElement.textContent).toContain('— inclui 1 fechado');
  });

  it('não mostra a legenda de detalhamento quando não há fechados nem cancelados', async () => {
    ticketsStoreFake.closedCount.set(0);
    ticketsStoreFake.canceledCount.set(0);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('inclui');
  });

  it('pluraliza corretamente a legenda de detalhamento quando há mais de um fechado e mais de um cancelado', async () => {
    ticketsStoreFake.closedCount.set(2);
    ticketsStoreFake.canceledCount.set(3);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('— inclui 2 fechados e 3 cancelados');
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
    expect(text).toContain('Quantidade de tickets abertos por período');
    expect(text).toContain('05/01');
    expect(text).toContain('5');
  });

  it('mostra Novo Ticket, Meus Tickets E Tickets sem responsável pra quem não é administrativo mas tem tickets:manage (ex. Atendente)', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Novo Ticket');
    expect(text).toContain('Meus Tickets');
    expect(text).toContain('Tickets sem responsável');
  });

  it('não mostra o atalho "Tickets sem responsável" pra quem não tem a permissão tickets:manage (ex. Solicitante)', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Tickets sem responsável');
  });

  it('troca Novo Ticket/Meus Tickets por "Tickets sem responsável" pra quem tem papel administrativo (users:read, roles:manage, departments:manage ou sectors:manage)', async () => {
    hasPermission.and.callFake((code: string) => code === 'users:read');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tickets sem responsável');
    expect(text).not.toContain('Novo Ticket');
    expect(text).not.toContain('Meus Tickets');
  });

  it('mantém Ações Rápidas restrito a atalhos contextuais ao dashboard, não a um menu de administração duplicado', async () => {
    hasPermission.and.returnValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Monitorar Tickets');
    expect(text).not.toContain('Gestão de Usuários');
    expect(text).not.toContain('Funções');
    expect(text).not.toContain('Departamentos e setores');
  });

  it('os atalhos de Ações Rápidas são links de verdade (<a>), não botões, pra funcionar com Ctrl+clique/nova aba', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const novoTicketLink = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .find(a => a.textContent?.includes('Novo Ticket'));

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
});
