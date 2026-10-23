import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TicketSummaryStore, TicketPersonalSummaryStore, TicketCount, TicketPriority, TicketStatus } from '../tickets';
import { SessionService } from '../shared';

describe('DashboardComponent', () => {
  /** Cria um store de resumo falso com signals reais, para o template reagir como no store verdadeiro. */
  function createTicketsStoreFake() {
    return {
      state: signal({ loading: false, error: null as string | null }),
      total: signal(10),
      openCount: signal(3),
      inProgressCount: signal(2),
      resolvedCount: signal(4),
      load: jasmine.createSpy('load')
    };
  }

  /** Cria um store de resumo pessoal falso com signals reais. */
  function createPersonalSummaryStoreFake() {
    return {
      counts: signal<TicketCount[]>([
        { priority: TicketPriority.High, status: TicketStatus.Open, count: 2 },
        { priority: TicketPriority.Low, status: TicketStatus.Resolved, count: 3 }
      ]),
      state: signal({ loading: false, error: null as string | null })
    };
  }

  type CurrentUserFake = { firstName: string; roles: { name: string }[] } | null;

  let ticketsStoreFake: ReturnType<typeof createTicketsStoreFake>;
  let personalSummaryStoreFake: ReturnType<typeof createPersonalSummaryStoreFake>;
  let hasPermission: jasmine.Spy;
  let currentUser: ReturnType<typeof signal<CurrentUserFake>>;

  beforeEach(async () => {
    ticketsStoreFake = createTicketsStoreFake();
    personalSummaryStoreFake = createPersonalSummaryStoreFake();
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);
    currentUser = signal<CurrentUserFake>({ firstName: 'Maria', roles: [{ name: 'Colaborador' }] });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketSummaryStore, useValue: ticketsStoreFake },
        { provide: TicketPersonalSummaryStore, useValue: personalSummaryStoreFake },
        { provide: SessionService, useValue: { hasPermission, currentUser, userId: signal('u1') } }
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

  it('carrega o resumo da empresa (para os cards) ao inicializar, para qualquer papel', async () => {
    currentUser.set({ firstName: 'Carlos', roles: [{ name: 'Administrador' }] });
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(ticketsStoreFake.load).toHaveBeenCalled();
  });

  it('mostra o alerta de erro quando o resumo da empresa falhar', async () => {
    ticketsStoreFake.state.set({ loading: false, error: 'Erro ao carregar o resumo dos tickets' });
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o resumo dos tickets');
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

  it('mostra a tabela acessível de Prioridade x Status ao alternar "Ver como tabela"', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const toggleButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Ver como tabela'));
    toggleButton?.click();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Quantidade dos seus tickets por prioridade e status');
    expect(text).toContain('Alta');
    expect(text).toContain('2');
  });

  it('não mostra o atalho de Gestão de Usuários sem a permissão users:read', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Gestão de Usuários');
  });

  it('mostra o atalho de Gestão de Usuários com a permissão users:read', async () => {
    hasPermission.and.returnValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Gestão de Usuários');
  });

  it('sempre mostra o atalho de Novo Ticket, independente de permissão', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Novo Ticket');
  });

  it('os atalhos de Ações Rápidas são links de verdade (<a>), não botões, pra funcionar com Ctrl+clique/nova aba', async () => {
    hasPermission.and.returnValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const novoTicketLink = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .find(a => a.textContent?.includes('Novo Ticket'));

    expect(novoTicketLink).withContext('o atalho "Novo Ticket" deve ser <a>, não <button>').toBeTruthy();
  });

  it('mostra o atalho de Monitorar Tickets com a permissão tickets:manage', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Monitorar Tickets');
  });

  it('mostra os atalhos de Funções e Departamentos conforme a permissão', async () => {
    hasPermission.and.callFake((code: string) => code === 'roles:manage');
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Funções');
    expect(text).not.toContain('Departamentos e setores');
  });
});
