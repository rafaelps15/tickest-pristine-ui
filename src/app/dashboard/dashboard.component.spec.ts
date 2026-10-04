import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TicketsStore } from '../tickets';
import { SessionService } from '../shared';

describe('DashboardComponent', () => {
  /** Cria um store de tickets falso com signals reais, para o template reagir como no store verdadeiro. */
  function createTicketsStoreFake() {
    return {
      tickets: signal([]),
      state: signal({ data: [], loading: false, error: null as string | null }),
      total: signal(4),
      openCount: signal(1),
      inProgressCount: signal(1),
      resolvedCount: signal(2),
      loadForCurrentUser: jasmine.createSpy('loadForCurrentUser')
    };
  }

  let ticketsStoreFake: ReturnType<typeof createTicketsStoreFake>;
  let hasPermission: jasmine.Spy;
  let currentUser: ReturnType<typeof signal<{ firstName: string } | null>>;

  beforeEach(async () => {
    ticketsStoreFake = createTicketsStoreFake();
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);
    currentUser = signal<{ firstName: string } | null>({ firstName: 'Maria' });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketsStore, useValue: ticketsStoreFake },
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

  it('carrega os tickets do usuário logado ao inicializar', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(ticketsStoreFake.loadForCurrentUser).toHaveBeenCalled();
  });

  it('renderiza os cards de estatísticas com os valores do store', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('4');
    expect(text).toContain('1');
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
});
