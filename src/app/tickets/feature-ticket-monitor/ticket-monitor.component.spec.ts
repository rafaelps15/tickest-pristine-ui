import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TicketMonitorComponent } from './ticket-monitor.component';
import { TicketMonitorStore } from '../application/ticket-monitor.store';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketSlaSummary } from '../entities/ticket-sla-summary';
import { Department, DepartmentsStore } from '../../departments';

describe('TicketMonitorComponent', () => {
  const ticket: TicketMonitorItem = {
    id: 't1', title: 'Impressora não funciona', priority: TicketPriority.High, status: TicketStatus.Open,
    requesterId: 'u1', requesterName: 'Maria Silva', requesterEmail: 'maria@empresa.com',
    assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };
  const department: Department = { id: 'd1', name: 'TI', description: '', responsibleUserName: null, sectors: [{ id: 's1', name: 'Suporte', description: null }] };
  const slaSummary: TicketSlaSummary = { activeCount: 10, onTimeCount: 6, atRiskCount: 3, breachedCount: 1, serverNowUtc: '2026-01-01T12:00:00Z' };

  /** Cria um store de monitoramento falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      filters: signal({ sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }),
      tickets: signal<TicketMonitorItem[]>([ticket]),
      listState: signal({ loading: false, error: null as string | null }),
      slaSummary: signal<TicketSlaSummary | undefined>(slaSummary),
      currentPage: signal(1),
      currentPageSize: signal(20),
      total: signal(1),
      totalPages: signal(1),
      hasPreviousPage: signal(false),
      hasNextPage: signal(false),
      load: jasmine.createSpy('load'),
      setStatus: jasmine.createSpy('setStatus'),
      setPriority: jasmine.createSpy('setPriority'),
      setSectorId: jasmine.createSpy('setSectorId'),
      setSlaStatus: jasmine.createSpy('setSlaStatus'),
      setSearch: jasmine.createSpy('setSearch'),
      setUnassignedOnly: jasmine.createSpy('setUnassignedOnly'),
      setSort: jasmine.createSpy('setSort'),
      goToPage: jasmine.createSpy('goToPage'),
      setPageSize: jasmine.createSpy('setPageSize'),
      clearFilters: jasmine.createSpy('clearFilters')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let departmentsStoreFake: { departments: ReturnType<typeof signal<Department[]>>; load: jasmine.Spy };

  beforeEach(async () => {
    storeFake = createStoreFake();
    departmentsStoreFake = { departments: signal<Department[]>([department]), load: jasmine.createSpy('load') };

    await TestBed.configureTestingModule({
      imports: [TicketMonitorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketMonitorStore, useValue: storeFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake }
      ]
    }).compileComponents();
  });

  it('carrega os tickets ao inicializar, sem recarregar os departamentos (o store já os carrega sozinho)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
    expect(departmentsStoreFake.load).not.toHaveBeenCalled();
  });

  it('aplica o filtro de status vindo da URL (?status=, usado pelos cards do Dashboard) ao inicializar', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ status: String(TicketStatus.Open) }) } }
    });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.setStatus).toHaveBeenCalledWith(TicketStatus.Open);
  });

  it('aplica o filtro "só sem responsável" vindo da URL (?unassignedOnly=true, usado pelo atalho do Dashboard) ao inicializar', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ unassignedOnly: 'true' }) } }
    });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.setUnassignedOnly).toHaveBeenCalledWith(true);
  });

  it('lista os setores do departamento no filtro, a partir do que já está no DepartmentsStore', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const sectorOptions = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#monitorSector option')
    ).map(option => option.textContent?.trim());

    expect(sectorOptions).toContain('Suporte');
  });

  it('renderiza os tickets carregados, com solicitante, setor, prioridade, status e SLA', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Impressora não funciona');
    expect(text).toContain('Maria Silva');
    expect(text).toContain('Suporte');
    expect(text).toContain('Alta');
    expect(text).toContain('Aberto');
    expect(text).toContain('No prazo');
  });

  it('o link "Ver detalhes" leva pro ticket com ?from=monitor, pra o detalhe saber de onde o usuário veio', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const detailLink = fixture.nativeElement.querySelector('a[aria-label^="Ver detalhes"]') as HTMLAnchorElement;
    expect(detailLink.getAttribute('href')).toBe('/tickets/t1?from=monitor');
  });

  it('mostra "Não atribuído" quando o ticket não tem atendente, e o nome quando tem', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', assignedToUserId: null, assignedToName: null },
      { ...ticket, id: 't2', assignedToUserId: 'u2', assignedToName: 'Carlos Souza' }
    ]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Não atribuído');
    expect(text).toContain('Carlos Souza');
  });

  it('renderiza os cards de resumo de SLA', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('10');
    expect(text).toContain('6');
    expect(text).toContain('3');
    expect(text).toContain('1');
  });

  it('mostra o estado vazio quando não há tickets', async () => {
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum ticket encontrado com esses filtros.');
  });

  it('mostra a mensagem de erro do store, com botão para tentar novamente', async () => {
    storeFake.listState.set({ loading: false, error: 'Você não tem permissão para monitorar os tickets do sistema.' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para monitorar os tickets do sistema.');

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(storeFake.load).toHaveBeenCalledTimes(2); // 1x no ngOnInit, 1x no clique
  });

  it('filtra pelo SLA ao clicar num card de resumo, e marca o card ativo como pressionado', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.card-stats-btn') as NodeListOf<HTMLButtonElement>;
    expect(cards.length).toBe(4);
    expect(cards[0].getAttribute('aria-pressed')).toBe('true'); // "Ativos": sem filtro de SLA é o padrão

    cards[3].click(); // "Atrasados"
    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(TicketSlaStatus.Breached);

    cards[0].click(); // "Ativos" limpa o filtro de SLA
    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(undefined);
  });

  it('muda o status selecionado', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('#monitorStatus') as HTMLSelectElement;
    select.value = String(TicketStatus.Open);
    select.dispatchEvent(new Event('change'));

    expect(storeFake.setStatus).toHaveBeenCalledWith(TicketStatus.Open);
  });

  it('alterna o filtro "Só sem responsável"', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('#monitorUnassignedOnly') as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(storeFake.setUnassignedOnly).toHaveBeenCalledWith(true);
  });

  it('anuncia o carregamento da tabela por leitor de tela e tem uma legenda acessível', async () => {
    storeFake.listState.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.spinner-border')?.getAttribute('role')).toBe('status');
  });

  it('limpa os filtros', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Limpar filtros'));
    button?.click();

    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('calcula o intervalo exibido no rodapé ("Exibindo X–Y de Z")', async () => {
    storeFake.currentPage.set(2);
    storeFake.currentPageSize.set(20);
    storeFake.total.set(45);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.rangeStart()).toBe(21);
    expect(fixture.componentInstance.rangeEnd()).toBe(40);
  });

  it('navega para a página clicada', async () => {
    storeFake.totalPages.set(3);
    storeFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const pageButtons = fixture.nativeElement.querySelectorAll('.card-footer button');
    const pageTwoButton = Array.from(pageButtons as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === '2');
    pageTwoButton?.click();

    expect(storeFake.goToPage).toHaveBeenCalledWith(2);
  });

  it('muda o tamanho da página', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(storeFake.setPageSize).toHaveBeenCalledWith(50);
  });

  it('indica um ticket atrasado quando o prazo já passou e não foi resolvido', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const overdueTicket: TicketMonitorItem = { ...ticket, dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: null };
    const resolvedTicket: TicketMonitorItem = { ...ticket, id: 't2', dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: '2020-01-01T00:00:00Z' };

    expect(fixture.componentInstance.isOverdue(overdueTicket)).toBeTrue();
    expect(fixture.componentInstance.isOverdue(resolvedTicket)).toBeFalse();
  });
});
