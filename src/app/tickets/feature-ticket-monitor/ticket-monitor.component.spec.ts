import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TicketMonitorComponent } from './ticket-monitor.component';
import { By } from '@angular/platform-browser';
import { TicketAssignDialogComponent } from '../../shared/ui/ticket-assign-dialog/ticket-assign-dialog.component';
import { TicketMonitorStore } from '../application/ticket-monitor.store';
import { TicketQuickInfoStore } from '../application/ticket-quick-info.store';
import { TicketDetail } from '../entities/ticket';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketSlaSummary } from '../entities/ticket-sla-summary';
import { TicketMonitorFilters } from '../entities/ticket-monitor-filters';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketAssignee } from '../entities/ticket-assignee';
import { TicketAssigneesStore } from '../application/ticket-assignees.store';
import { Department, DepartmentsStore } from '../../departments';
import { SessionService, ToastService } from '../../shared';

describe('TicketMonitorComponent', () => {
  const ticket: TicketMonitorItem = {
    id: 't1', title: 'Impressora não funciona', priority: TicketPriority.High, status: TicketStatus.Open,
    requesterId: 'u1', requesterName: 'Maria Silva', requesterEmail: 'maria@empresa.com',
    assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };
  const department: Department = { id: 'd1', name: 'TI', description: '', responsibleUserId: null, responsibleUserName: null, activeTicketCount: 0, sectors: [{ id: 's1', name: 'Suporte', description: null, activeTicketCount: 0 }] };
  const slaSummary: TicketSlaSummary = { activeCount: 10, onTimeCount: 6, atRiskCount: 3, breachedCount: 1, serverNowUtc: '2026-01-01T12:00:00Z' };

  /** Cria um store de monitoramento falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      filters: signal<TicketMonitorFilters>({ activeOnly: true, sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 }),
      tickets: signal<TicketMonitorItem[]>([ticket]),
      listState: signal({ loading: false, error: null as string | null }),
      slaSummary: signal<TicketSlaSummary | undefined>(slaSummary),
      slaSummaryState: signal({ loading: false, error: null as string | null }),
      clockOffsetMs: signal(0),
      currentPage: signal(1),
      currentPageSize: signal(20),
      total: signal(1),
      totalPages: signal(1),
      hasPreviousPage: signal(false),
      hasNextPage: signal(false),
      assigningToMeIds: signal<string[]>([]),
      mutationError: signal<string | null>(null),
      responsibleCandidates: signal<TicketAssignee[]>([]),
      searchingResponsibleCandidates: signal(false),
      responsibleSearchError: signal<string | null>(null),
      assigningResponsible: signal(false),
      listLoadedAtMs: signal<number | null>(Date.now()),
      load: jasmine.createSpy('load'),
      reloadSlaSummary: jasmine.createSpy('reloadSlaSummary'),
      clearMutationError: jasmine.createSpy('clearMutationError'),
      setStatus: jasmine.createSpy('setStatus'),
      setPriority: jasmine.createSpy('setPriority'),
      setSectorIds: jasmine.createSpy('setSectorIds'),
      setCreatedRange: jasmine.createSpy('setCreatedRange'),
      setAwaiting: jasmine.createSpy('setAwaiting'),
      setSlaStatus: jasmine.createSpy('setSlaStatus'),
      setSearch: jasmine.createSpy('setSearch'),
      setUnassignedOnly: jasmine.createSpy('setUnassignedOnly'),
      setAssignedToUserId: jasmine.createSpy('setAssignedToUserId'),
      setSort: jasmine.createSpy('setSort'),
      goToPage: jasmine.createSpy('goToPage'),
      setPageSize: jasmine.createSpy('setPageSize'),
      clearFilters: jasmine.createSpy('clearFilters'),
      assignToMe: jasmine.createSpy('assignToMe'),
      hydrateFiltersFromUrl: jasmine.createSpy('hydrateFiltersFromUrl'),
      searchResponsibleCandidates: jasmine.createSpy('searchResponsibleCandidates'),
      clearResponsibleSearch: jasmine.createSpy('clearResponsibleSearch'),
      assignResponsible: jasmine.createSpy('assignResponsible')
    };
  }

  /** Cria um store de informações rápidas falso — a tela só precisa repassar a seleção a ele. */
  function createQuickInfoStoreFake() {
    return {
      ticket: signal<TicketDetail | undefined>(undefined),
      state: signal({ loading: false, error: null as string | null }),
      select: jasmine.createSpy('select'),
      reload: jasmine.createSpy('reload')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let quickInfoStoreFake: ReturnType<typeof createQuickInfoStoreFake>;
  let departmentsStoreFake: { departments: ReturnType<typeof signal<Department[]>>; load: jasmine.Spy };
  let hasPermission: jasmine.Spy;
  let sessionServiceFake: { hasPermission: jasmine.Spy; currentUser: ReturnType<typeof signal<{ id: string } | null>> };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    storeFake = createStoreFake();
    quickInfoStoreFake = createQuickInfoStoreFake();
    departmentsStoreFake = { departments: signal<Department[]>([department]), load: jasmine.createSpy('load') };
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(true);
    sessionServiceFake = { hasPermission, currentUser: signal({ id: 'u-current' }) };
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [TicketMonitorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketMonitorStore, useValue: storeFake },
        { provide: TicketQuickInfoStore, useValue: quickInfoStoreFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake },
        { provide: TicketAssigneesStore, useValue: { assignees: signal<TicketAssignee[]>([{ id: 'u-ana', fullName: 'Ana Souza', sectorId: 's1', sectorName: 'Suporte' }]), total: signal(1) } },
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  it('the opening period coming from Início already filters the list: no "ainda não é aplicado" warning', async () => {
    storeFake.filters.set({ ...storeFake.filters(), createdFrom: '2026-10-20', createdTo: '2026-10-26' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('ainda não é aplicado nesta lista');
  });

  it('loads the tickets on init, without reloading the departments (the store already loads them by itself)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
    expect(departmentsStoreFake.load).not.toHaveBeenCalled();
  });

  it('restores the filters, sorting and page from the query string on init (RF-28)', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          queryParamMap: convertToParamMap({
            status: String(TicketStatus.Open), priority: String(TicketPriority.High), sectorId: 's1',
            slaStatus: String(TicketSlaStatus.AtRisk), unassignedOnly: 'true',
            sort: String(TicketSortOrder.DueDate), page: '3', pageSize: '50'
          })
        }
      }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith({
      status: TicketStatus.Open, activeOnly: undefined, priority: TicketPriority.High, sectorIds: ['s1'],
      createdFrom: undefined, createdTo: undefined, awaiting: undefined,
      slaStatus: TicketSlaStatus.AtRisk, unassignedOnly: true, assignedToUserId: undefined,
      sort: TicketSortOrder.DueDate, page: 3, pageSize: 50
    });
  });

  it('falls back to the default when a URL parameter is invalid (outside the enum, non-numeric etc.), without breaking (EC-08)', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          queryParamMap: convertToParamMap({ status: '9999', page: 'abc', pageSize: '7', sort: '9999' })
        }
      }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith({
      status: undefined, activeOnly: true, priority: undefined, sectorIds: undefined,
      createdFrom: undefined, createdTo: undefined, awaiting: undefined, slaStatus: undefined,
      unassignedOnly: undefined, assignedToUserId: undefined, sort: TicketSortOrder.DueDate, page: 1, pageSize: 20
    });
  });

  it('without a status in the URL opens on the work queue (Ativos), and "?status=all" is "Todos os status"', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ status: 'all' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith(jasmine.objectContaining({ status: undefined, activeOnly: undefined }));
  });

  it('writes "Todos os status" to the URL as status=all (the default, Ativos, does not go in the URL)', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    storeFake.filters.set({ sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigate.calls.mostRecent().args[1]!.queryParams!['status']).toBe('all');
  });

  it('reads from the Início drill-down several sectors, the opening period, "aguardando" and a person as assignee', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({
        sectorId: ['s1', 's2'], createdFrom: '2026-10-01', createdTo: '2026-02-30', awaiting: '2', assignedToUserId: 'u-ana'
      }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith(jasmine.objectContaining({
      sectorIds: ['s1', 's2'], createdFrom: '2026-10-01', createdTo: undefined, awaiting: TicketAwaiting.Agent, assignedToUserId: 'u-ana'
    }));
  });

  it('writes several repeated sectors and the assignee person to the URL; the user themselves becomes "atribuídos a mim"', async () => {
    storeFake.filters.set({ ...storeFake.filters(), sectorIds: ['s1', 's2'], assignedToUserId: 'u-ana', awaiting: TicketAwaiting.Requester });
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const params = navigate.calls.mostRecent().args[1]!.queryParams!;
    expect(params['sectorId']).toEqual(['s1', 's2']);
    expect(params['assignedToUserId']).toBe('u-ana');
    expect(params['assignedToMe']).toBeNull();
    expect(params['awaiting']).toBe(TicketAwaiting.Requester);

    storeFake.filters.set({ ...storeFake.filters(), assignedToUserId: 'u-current' });
    await fixture.whenStable();
    const mine = navigate.calls.mostRecent().args[1]!.queryParams!;
    expect(mine['assignedToMe']).toBe('true');
    expect(mine['assignedToUserId']).toBeNull();
  });

  it('with several sectors coming from Início, names the set and allows going back to it', async () => {
    departmentsStoreFake.departments.set([{ ...department, sectors: [{ id: 's1', name: 'Suporte', description: null, activeTicketCount: 0 }, { id: 's2', name: 'Infra', description: null, activeTicketCount: 0 }] }]);
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ sectorId: ['s1', 's2'] }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');
    storeFake.filters.set({ ...storeFake.filters(), sectorIds: ['s1', 's2'] });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const sector = fixture.nativeElement.querySelector('#monitorSector') as HTMLSelectElement;
    expect(sector.value).toBe('many');
    expect(sector.textContent).toContain('TI (todos os setores)');
    expect(fixture.nativeElement.textContent).toContain('O setor e os filtros valem pros números do topo e pra tabela.');

    sector.value = 's1';
    sector.dispatchEvent(new Event('change'));
    expect(storeFake.setSectorIds).toHaveBeenCalledWith(['s1']);

    storeFake.filters.set({ ...storeFake.filters(), sectorIds: ['s1'] });
    await fixture.whenStable();
    sector.value = 'many';
    sector.dispatchEvent(new Event('change'));
    expect(storeFake.setSectorIds).toHaveBeenCalledWith(['s1', 's2']);
  });

  it('marks the sector from the URL in the selector even when the departments arrive later', async () => {
    departmentsStoreFake.departments.set([]);
    storeFake.filters.set({ ...storeFake.filters(), sectorIds: ['s1'] });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    departmentsStoreFake.departments.set([department]);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#monitorSector') as HTMLSelectElement).value).toBe('s1');
  });

  it('offers the team members in the assignee filter and applies the chosen one', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const responsible = fixture.nativeElement.querySelector('#monitorResponsible') as HTMLSelectElement;
    expect(responsible.textContent).toContain('Ana Souza');
    responsible.value = 'u-ana';
    responsible.dispatchEvent(new Event('change'));

    expect(storeFake.setAssignedToUserId).toHaveBeenCalledWith('u-ana');
  });

  it('applies "aguardando" and the opening period in "Mais filtros", rejecting a start after the end', async () => {
    storeFake.filters.set({ ...storeFake.filters(), createdTo: '2026-10-10' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const awaiting = fixture.nativeElement.querySelector('#monitorAwaiting') as HTMLSelectElement;
    awaiting.value = String(TicketAwaiting.Agent);
    awaiting.dispatchEvent(new Event('change'));
    expect(storeFake.setAwaiting).toHaveBeenCalledWith(TicketAwaiting.Agent);

    const from = fixture.nativeElement.querySelector('#monitorCreatedFrom') as HTMLInputElement;
    from.value = '2026-10-20';
    from.dispatchEvent(new Event('change'));
    expect(storeFake.setCreatedRange).not.toHaveBeenCalled();
    from.value = '2026-10-01';
    from.dispatchEvent(new Event('change'));
    expect(storeFake.setCreatedRange).toHaveBeenCalledWith('2026-10-01', '2026-10-10');
  });

  it('shows whose action the ticket is waiting for, when the back end sends it', async () => {
    storeFake.tickets.set([{ ...ticket, waitingOn: TicketAwaiting.Requester }]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('td[data-label="Status"]').textContent).toContain('Aguardando o solicitante');
  });

  it('"?status=active" (backlog and critical from Início) becomes the Ativos group: Aberto + Em Andamento', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ status: 'active', priority: '4' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith(jasmine.objectContaining({
      status: undefined, activeOnly: true, priority: TicketPriority.Urgent
    }));
  });

  it('"?assignedToMe=true" (shortcut from Início) becomes the logged-in user filter, without the id in the URL', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ assignedToMe: 'true' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith(jasmine.objectContaining({ assignedToUserId: 'u-current' }));
  });

  it('restores the selected ticket from the "ticketId" in the query string on init', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ ticketId: 't1' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedTicketId()).toBe('t1');
  });

  it('reflects the selected ticket in the URL, without navigating to another route', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    navigateSpy.calls.reset();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ ticketId: 't1' }),
      replaceUrl: true
    }));
  });

  it('does not include the free search term in the URL (RNF-32 forbids free text in the query string)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    storeFake.filters.set({ search: 'maria@empresa.com', status: TicketStatus.Open, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 });

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalled();
    const queryParams = navigateSpy.calls.mostRecent().args[1]!.queryParams as Record<string, unknown>;
    expect(Object.keys(queryParams)).not.toContain('search');
    expect(queryParams['status']).toBe(TicketStatus.Open);
  });

  it('reflects non-default filter/sorting/page in the URL, without stacking history', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    storeFake.filters.set({ status: TicketStatus.Open, sort: TicketSortOrder.Newest, page: 2, pageSize: 20 });

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ status: TicketStatus.Open, page: 2 }),
      replaceUrl: true
    }));
  });

  it('does not navigate again when the filters already match the current URL (avoids a loop)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('lists the department sectors in the filter, from what is already in the DepartmentsStore', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const sectorOptions = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#monitorSector option')
    ).map(option => option.textContent?.trim());

    expect(sectorOptions).toContain('Suporte');
  });

  it('renders the loaded tickets, with requester, sector, priority, status and SLA', async () => {
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

  it('the "Ver detalhes" link leads to the ticket with ?from=monitor, so the detail knows where the user came from', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const detailLink = fixture.nativeElement.querySelector('a[aria-label^="Ver detalhes"]') as HTMLAnchorElement;
    expect(detailLink.getAttribute('href')).toBe('/tickets/t1?from=monitor');
  });

  it('selects a ticket when the row is clicked, and deselects it when the same row is clicked again', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    const selectButton = row.querySelector('.ticket-select') as HTMLButtonElement;
    expect(selectButton.getAttribute('aria-expanded')).toBe('false');

    row.click();
    await fixture.whenStable();
    expect(selectButton.getAttribute('aria-expanded')).toBe('true');
    expect(row.classList).toContain('table-active');

    row.click();
    await fixture.whenStable();
    expect(selectButton.getAttribute('aria-expanded')).toBe('false');
    expect(row.classList).not.toContain('table-active');
  });

  it('selects through the title button (keyboard/screen reader) without toggling twice because of the row click', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    const selectButton = row.querySelector('.ticket-select') as HTMLButtonElement;
    selectButton.click();
    await fixture.whenStable();

    expect(selectButton.getAttribute('aria-expanded')).toBe('true');
    expect(row.hasAttribute('role')).toBeFalse();
    expect(row.hasAttribute('tabindex')).toBeFalse();
  });

  it('gives the title button its visible text as accessible name, with no label repeating the state (WCAG 2.5.3)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const selectButton = fixture.nativeElement.querySelector('tbody tr.ticket-row .ticket-select') as HTMLButtonElement;
    expect(selectButton.hasAttribute('aria-label')).toBeFalse();
    expect(selectButton.hasAttribute('aria-pressed')).toBeFalse();
    expect(selectButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not toggle the row selection when the "Atribuir a mim" action button is clicked', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    const assignButton = row.querySelector('button[aria-label^="Atribuir a mim:"]') as HTMLButtonElement;
    assignButton.click();
    await fixture.whenStable();

    expect(row.querySelector('.ticket-select')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the "Informações do Chamado" panel when a ticket is selected, and passes the selection on to the TicketQuickInfoStore', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeTruthy();
    expect(quickInfoStoreFake.select).toHaveBeenCalledWith('t1');
  });

  it('passes the description and its failure from the TicketQuickInfoStore to the panel, and the panel retry goes back to the store', async () => {
    quickInfoStoreFake.ticket.set({ description: 'Fumaça saindo da impressora.' } as TicketDetail);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement).click();
    await fixture.whenStable();
    const panel = () => fixture.nativeElement.querySelector('app-ticket-monitor-info-panel') as HTMLElement;
    expect(panel().textContent).toContain('Fumaça saindo da impressora.');

    quickInfoStoreFake.state.set({ loading: false, error: 'Erro ao carregar os detalhes do chamado' });
    await fixture.whenStable();
    expect(panel().textContent).toContain('Erro ao carregar os detalhes do chamado');
    (Array.from(panel().querySelectorAll('button')).find(button => button.textContent?.includes('Tentar novamente')) as HTMLButtonElement).click();

    expect(quickInfoStoreFake.reload).toHaveBeenCalled();
  });

  it('does not show the panel when the selected ticket is no longer in the current page/filter', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ ticketId: 'inexistente' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();
  });

  it('closes the panel and clears the selection on receiving the "close" event', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeTruthy();

    fixture.componentInstance.closeInfoPanel();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();
    expect(fixture.componentInstance.selectedTicketId()).toBeUndefined();
  });

  it('closes the panel with the Esc key, from anywhere on the screen, and returns focus to whoever opened it', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();
    expect(document.activeElement).toBe(row.querySelector('.ticket-select'));
  });

  it('does nothing when Esc is pressed with no panel open', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))).not.toThrow();
  });

  it('closes the panel when the backdrop (overlay on small screens) is clicked, and returns focus to whoever opened it', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.info-panel-backdrop')).toBeNull();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();

    const backdrop = fixture.nativeElement.querySelector('.info-panel-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.info-panel-backdrop')).toBeNull();
    expect(document.activeElement).toBe(row.querySelector('.ticket-select'));
  });

  it('shows the Guia da Tela right below the header, before the SLA summary and the table, outside the table column', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const html = fixture.nativeElement.innerHTML as string;
    const headerIndex = html.indexOf('<app-page-header');
    const guideIndex = html.indexOf('<app-ticket-monitor-guide');
    const slaIndex = html.indexOf('id="monitorScopeHint"');
    const tableIndex = html.indexOf('<table');

    expect(headerIndex).toBeGreaterThanOrEqual(0);
    expect(guideIndex).toBeGreaterThan(headerIndex);
    expect(guideIndex).toBeLessThan(slaIndex);
    expect(guideIndex).toBeLessThan(tableIndex);
    expect(fixture.nativeElement.querySelector('.row app-ticket-monitor-guide')).toBeNull();
  });

  it('shows "Não atribuído" when the ticket has no assignee, and the name when it has one', async () => {
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

  it('shows "Atribuir a mim" only for an active ticket without an assignee, and calls store.assignToMe with the logged-in user', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', assignedToUserId: null, status: TicketStatus.Open },
      { ...ticket, id: 't2', assignedToUserId: 'u2', assignedToName: 'Carlos Souza', status: TicketStatus.Open },
      { ...ticket, id: 't3', assignedToUserId: null, status: TicketStatus.Resolved }
    ]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const assignButtons = fixture.nativeElement.querySelectorAll('button[aria-label^="Atribuir a mim:"]') as NodeListOf<HTMLButtonElement>;
    expect(assignButtons.length).withContext('only ticket t1 (active and without an assignee) must have the button').toBe(1);

    assignButtons[0].click();
    expect(storeFake.assignToMe).toHaveBeenCalledWith('t1', 'u-current', jasmine.any(Function));
  });

  it('shows a confirmation toast when assigning "to me" succeeds', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const assignButton = fixture.nativeElement.querySelector('button[aria-label^="Atribuir a mim:"]') as HTMLButtonElement;
    assignButton.click();

    const onSuccess = storeFake.assignToMe.calls.mostRecent().args[2] as () => void;
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado atribuído a você.');
  });

  it('does not show "Atribuir a mim" without the tickets:manage permission', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button[aria-label^="Atribuir a mim:"]')).toBeNull();
  });

  it('disables and shows a spinner only on the button of the ticket being assigned', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', assignedToUserId: null, status: TicketStatus.Open },
      { ...ticket, id: 't2', assignedToUserId: null, status: TicketStatus.Open }
    ]);
    storeFake.assigningToMeIds.set(['t1']);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const assignButtons = Array.from(fixture.nativeElement.querySelectorAll('button[aria-label^="Atribuir a mim:"]') as NodeListOf<HTMLButtonElement>);
    expect(assignButtons[0].disabled).toBeTrue();
    expect(assignButtons[0].querySelector('.spinner-border')).toBeTruthy();
    expect(assignButtons[1].disabled).toBeFalse();
    expect(assignButtons[1].querySelector('.spinner-border')).toBeFalsy();
  });

  it('shows the assignment error message when it fails', async () => {
    storeFake.mutationError.set('Não foi possível atribuir — o chamado pode já ter outro responsável ou ter mudado de status. Tente novamente.');
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('já ter outro responsável');
  });

  it('renders the SLA summary cards', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('10');
    expect(text).toContain('6');
    expect(text).toContain('3');
    expect(text).toContain('1');
  });

  it('with search, Status, SLA or Aguardando applied, says the numbers at the top do not follow those filters', async () => {
    storeFake.filters.set({ ...storeFake.filters(), slaStatus: TicketSlaStatus.Breached });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Os números seguem setor, prioridade, responsável e período — não a busca, o Status, o SLA nem o Aguardando.');
  });

  it('puts the Setor in the header actions, above the numbers at the top, with a single line stating the scope', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const sector = fixture.nativeElement.querySelector('#monitorSector') as HTMLSelectElement;
    const hint = fixture.nativeElement.querySelector(`#${sector.getAttribute('aria-describedby')}`) as HTMLElement;
    expect(hint.textContent).toContain('O setor e os filtros valem pros números do topo e pra tabela.');
    expect(sector.closest('app-page-header')).not.toBeNull();
    expect(sector.compareDocumentPosition(fixture.nativeElement.querySelector('app-stat-card')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sector.closest('app-filter-bar')).toBeNull();
  });

  it('collapses Prioridade into "Mais filtros", with the count and a summary of the applied ones; Ordenar stays at the top of the table', async () => {
    storeFake.filters.set({ ...storeFake.filters(), priority: 3, awaiting: TicketAwaiting.Agent });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const more = fixture.nativeElement.querySelector('.btn-more-filters') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('#monitorMoreFilters').hidden).toBeTrue();
    expect(more.textContent).toContain('Mais filtros (2)');
    expect(fixture.nativeElement.textContent).toContain('Prioridade Alta · Aguardando a equipe');
    const sort = fixture.nativeElement.querySelector('#monitorSort') as HTMLSelectElement;
    expect(sort.closest('#monitorMoreFilters')).toBeNull();
    expect(sort.closest('.card')).not.toBeNull();

    more.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#monitorMoreFilters').hidden).toBeFalse();
    expect(more.getAttribute('aria-expanded')).toBe('true');
  });

  it('separates the "em monitoramento" SLA states from the "já resolvidos" ones in the dropdown, in distinct optgroups', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const groups = Array.from(fixture.nativeElement.querySelectorAll('#monitorSla optgroup') as NodeListOf<HTMLOptGroupElement>);
    expect(groups.map(g => g.label)).toEqual(['Em monitoramento', 'Já resolvidos']);

    const liveOptions = Array.from(groups[0].querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(o => o.textContent?.trim());
    expect(liveOptions).toEqual(['No prazo', 'Em risco', 'Atrasado']);

    const resolvedOptions = Array.from(groups[1].querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(o => o.textContent?.trim());
    expect(resolvedOptions).toEqual(['Cumprido', 'Resolvido com atraso', 'Sem SLA']);
  });

  it('on the work queue with no filter, the empty state is "Fila em dia", with a shortcut to all statuses', async () => {
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Fila em dia.');
    (fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement).click();
    expect(storeFake.setStatus).toHaveBeenCalledWith(undefined);
  });

  it('with "Todos os status" and nothing else, the empty state says there are no tickets yet', async () => {
    storeFake.tickets.set([]);
    storeFake.filters.set({ sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Ainda não há chamados.');
  });

  it('with a filter, offers "Limpar filtros" in the empty state, and clears on click', async () => {
    storeFake.tickets.set([]);
    storeFake.filters.set({ ...storeFake.filters(), priority: 4 });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement).click();

    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('does not close the panel when Esc originates inside a modal (only closes the modal)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.selectTicket(storeFake.tickets()[0].id);
    fixture.componentInstance.onOpenAssignResponsibleModal(storeFake.tickets()[0].id);
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('app-ticket-assign-dialog .modal') as HTMLElement;
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedTicketId()).toBe(storeFake.tickets()[0].id);
  });

  it('switches the panel to modal mode (overlay) only below "lg"', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.selectTicket(storeFake.tickets()[0].id);

    fixture.componentInstance.isOverlayViewport.set(true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.info-panel').getAttribute('aria-modal')).toBe('true');

    fixture.componentInstance.isOverlayViewport.set(false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.info-panel').hasAttribute('aria-modal')).toBeFalse();
  });

  it('shows the store error message, with a button to try again', async () => {
    storeFake.listState.set({ loading: false, error: 'Você não tem permissão para monitorar os chamados do sistema.' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para monitorar os chamados do sistema.');

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(storeFake.load).toHaveBeenCalledTimes(2); // 1x no ngOnInit, 1x no clique
  });

  it('filters by SLA when a summary card is clicked, and marks the active card as pressed', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.stat-press') as NodeListOf<HTMLButtonElement>;
    expect(cards.length).toBe(4);
    expect(cards[0].getAttribute('aria-pressed')).toBe('true'); // "Ativos": o padrão da tela

    cards[3].click(); // "Atrasados"
    expect(storeFake.setStatus).toHaveBeenCalledWith('active');
    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(TicketSlaStatus.Breached);

    cards[0].click(); // "Ativos" limpa o filtro de SLA
    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(undefined);
  });

  it('with "Todos os status", the "Ativos" card does not appear pressed (it does not describe the table)', async () => {
    storeFake.filters.set({ sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.stat-press') as NodeListOf<HTMLButtonElement>;
    expect(cards[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('when an SLA summary card is clicked, also sorts by nearest due date (urgency)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.stat-press') as NodeListOf<HTMLButtonElement>;
    cards[2].click(); // "Em Risco"

    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(TicketSlaStatus.AtRisk);
    expect(storeFake.setSort).toHaveBeenCalledWith(TicketSortOrder.DueDate);
  });

  it('changes the selected status', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('#monitorStatus') as HTMLSelectElement;
    select.value = String(TicketStatus.Open);
    select.dispatchEvent(new Event('change'));

    expect(storeFake.setStatus).toHaveBeenCalledWith(TicketStatus.Open);
  });

  it('the "Responsável" filter applies "Atribuídos a mim" (with the logged-in user id), "Sem responsável" and "Qualquer um"', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('#monitorResponsible') as HTMLSelectElement;
    expect(select.closest('#monitorMoreFilters')).toBeNull();

    select.value = 'me';
    select.dispatchEvent(new Event('change'));
    expect(storeFake.setAssignedToUserId).toHaveBeenCalledWith('u-current');

    select.value = 'none';
    select.dispatchEvent(new Event('change'));
    expect(storeFake.setUnassignedOnly).toHaveBeenCalledWith(true);

    select.value = 'any';
    select.dispatchEvent(new Event('change'));
    expect(storeFake.setUnassignedOnly).toHaveBeenCalledWith(false);
    expect(storeFake.setAssignedToUserId).toHaveBeenCalledWith(undefined);
  });

  it('announces the table loading to screen readers and has an accessible caption', async () => {
    storeFake.tickets.set([]);
    storeFake.listState.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table caption')).not.toBeNull();
    const status = fixture.nativeElement.querySelector('app-loading-state') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toContain('Carregando chamados');
  });

  it('keeps the current list visible (only faded) when reloading with a filter/page, instead of removing everything', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    storeFake.listState.set({ loading: true, error: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
  });

  it('clears the filters', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Limpar filtros'));
    button?.click();

    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('computes the range shown in the footer ("Exibindo X–Y de Z")', async () => {
    storeFake.currentPage.set(2);
    storeFake.currentPageSize.set(20);
    storeFake.total.set(45);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toContain('Exibindo 21–40 de');
  });

  it('navigates to the clicked page', async () => {
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

  it('changes the page size', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(storeFake.setPageSize).toHaveBeenCalledWith(50);
  });

  it('flags an overdue ticket when the due date has passed and it is not resolved', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const overdueTicket: TicketMonitorItem = { ...ticket, dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: null };
    const resolvedTicket: TicketMonitorItem = { ...ticket, id: 't2', dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: '2020-01-01T00:00:00Z' };

    expect(fixture.componentInstance.isOverdue(overdueTicket)).toBeTrue();
    expect(fixture.componentInstance.isOverdue(resolvedTicket)).toBeFalse();
  });

  it('shows the relative due date in the SLA cell, by server time, with the delay stated in text (not only color)', async () => {
    const inTwoHours = new Date(Date.now() + 2 * 3_600_000 + 30_000).toISOString();
    storeFake.tickets.set([
      { ...ticket, id: 't1', dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: null },
      { ...ticket, id: 't2', dueAtUtc: inTwoHours, resolvedAtUtc: null }
    ]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cells = Array.from(fixture.nativeElement.querySelectorAll('td[data-label="SLA e prazo"]') as NodeListOf<HTMLElement>);
    expect(cells[0].textContent).toContain('venceu há');
    expect(cells[0].querySelector('.text-danger')).not.toBeNull();
    expect(cells[1].textContent).toContain('vence em 2h');
    expect(fixture.nativeElement.querySelector('th:nth-child(7)').textContent).toContain('SLA e prazo');
  });

  it('the relative due date follows the server clock, not the browser clock', async () => {
    // Prazo daqui a 30 min no navegador, mas o servidor está 1h à frente: já venceu.
    storeFake.clockOffsetMs.set(3_600_000);
    storeFake.tickets.set([{ ...ticket, dueAtUtc: new Date(Date.now() + 30 * 60_000).toISOString(), resolvedAtUtc: null }]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('td[data-label="SLA e prazo"]').textContent).toContain('venceu há');
  });

  it('shows "Atribuir responsável" for an active ticket, with or without a current assignee', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', status: TicketStatus.Open, assignedToUserId: null },
      { ...ticket, id: 't2', status: TicketStatus.Open, assignedToUserId: 'u2', assignedToName: 'Carlos Souza' },
      { ...ticket, id: 't3', status: TicketStatus.Resolved, assignedToUserId: null }
    ]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button[aria-label*="responsável: "]') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).withContext('only the active tickets (t1, t2) must have the button').toBe(2);
  });

  it('does not show "Atribuir responsável" for someone with tickets:manage but without tickets:assign, but keeps "Atribuir a mim"', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:manage');
    storeFake.tickets.set([{ ...ticket, id: 't1', status: TicketStatus.Open, assignedToUserId: null }]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('button[aria-label*="responsável: "]').length).toBe(0);
    expect(fixture.componentInstance.canAssignToMe({ ...ticket, status: TicketStatus.Open, assignedToUserId: null })).toBeTrue();
  });

  it('opens the "Atribuir responsável" dialog for the clicked ticket, without inheriting the search from a previous opening', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const openButton = fixture.nativeElement.querySelector('button[aria-label*="responsável: "]') as HTMLButtonElement;
    openButton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.assigningResponsibleTicketId()).toBe('t1');
    expect(storeFake.clearResponsibleSearch).toHaveBeenCalled();
    const dialog = fixture.debugElement.query(By.directive(TicketAssignDialogComponent)).componentInstance as TicketAssignDialogComponent;
    expect(dialog.ticketTitle()).toBe(ticket.title);
  });

  it('searches by title with a 300ms debounce after typing stops, without searching on every letter', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#monitorSearch') as HTMLInputElement;
    input.value = 'impressora';
    input.dispatchEvent(new Event('input'));

    expect(storeFake.setSearch).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 350));

    expect(storeFake.setSearch).toHaveBeenCalledWith('impressora');
  });

  it('when clearing the filters, also clears the search text not yet applied', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.searchInput.set('impressora');

    const clearButton = fixture.nativeElement.querySelector('.btn-clear-filters') as HTMLButtonElement;
    clearButton.click();

    expect(fixture.componentInstance.searchInput()).toBe('');
    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('shows the SLA summary error with a retry button', async () => {
    storeFake.slaSummaryState.set({ loading: false, error: 'Erro ao carregar o resumo de SLA' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o resumo de SLA');

    // Linha junto dos números (que mostram "—"), não um alerta grande empilhado com os da lista.
    const line = fixture.nativeElement.querySelector('p[role="alert"]') as HTMLElement;
    expect(line.textContent).toContain('Erro ao carregar o resumo de SLA');
    // Falha técnica é neutra: nada de vermelho.
    expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
    expect(line.classList).not.toContain('text-danger');
    (line.querySelector('button') as HTMLButtonElement).click();

    expect(storeFake.reloadSlaSummary).toHaveBeenCalled();
  });

  it('allows closing the assignment error alert', async () => {
    storeFake.mutationError.set('Não foi possível atribuir.');
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const closeButton = fixture.nativeElement.querySelector('.alert .btn-close') as HTMLButtonElement;
    closeButton.click();

    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('with the "Atribuir responsável" dialog open, the assignment error appears only inside it', async () => {
    storeFake.mutationError.set('Não foi possível atribuir.');
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    fixture.componentInstance.assigningResponsibleTicketId.set(ticket.id);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.alert .btn-close')).toBeNull();
  });

  it('groups the row actions (assign/view details) in a single "⋮" menu, instead of loose buttons', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    expect(row.querySelector('.dropdown-menu')).toBeTruthy();
    expect(row.querySelectorAll('[data-bs-toggle="dropdown"]').length).toBe(1);
  });

  it('wires the dialog search to the store and assigns the confirmed candidate, with a toast, closing the dialog', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.onOpenAssignResponsibleModal('t1');
    await fixture.whenStable();

    const dialog = fixture.debugElement.query(By.directive(TicketAssignDialogComponent)).componentInstance as TicketAssignDialogComponent;
    dialog.searchRequested.emit('joão');
    expect(storeFake.searchResponsibleCandidates).toHaveBeenCalledWith('joão');

    dialog.confirm.emit({ userId: 'u2', name: 'João Pedro' });
    expect(storeFake.assignResponsible).toHaveBeenCalledWith('t1', 'u2', jasmine.any(Function));

    const onSuccess = storeFake.assignResponsible.calls.mostRecent().args[2] as () => void;
    onSuccess();
    await fixture.whenStable();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Responsável agora: João Pedro.');
    expect(fixture.debugElement.query(By.directive(TicketAssignDialogComponent))).toBeNull();
  });

  it('does not trigger the assignment if no ticket has the dialog open', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    fixture.componentInstance.onConfirmResponsible({ userId: 'u2', name: 'João Pedro' });

    expect(storeFake.assignResponsible).not.toHaveBeenCalled();
  });

  describe('SLA badge that follows the clock', () => {
    it('shows "Atrasado" in the row and in the panel when an active "No prazo" ticket expires while the screen is open', async () => {
      storeFake.tickets.set([{ ...ticket, slaStatus: TicketSlaStatus.OnTime, dueAtUtc: new Date(Date.now() - 60_000).toISOString() }]);
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();
      fixture.componentInstance.selectedTicketId.set(ticket.id);
      await fixture.whenStable();

      const cell = fixture.nativeElement.querySelector('td[data-label="SLA e prazo"] .badge') as HTMLElement;
      expect(cell.textContent?.trim()).toBe('Atrasado');
      expect(cell.classList).toContain('bg-label-danger');
      expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel').textContent).toContain('Atrasado');
    });

    it('keeps the list badge while the due date has not passed, and never changes the one of an already resolved ticket', async () => {
      storeFake.tickets.set([
        { ...ticket, id: 't1', slaStatus: TicketSlaStatus.AtRisk, dueAtUtc: new Date(Date.now() + 3_600_000).toISOString() },
        { ...ticket, id: 't2', status: TicketStatus.Resolved, slaStatus: TicketSlaStatus.Met, resolvedAtUtc: '2026-01-01T13:00:00Z' }
      ]);
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();

      const badges = [...fixture.nativeElement.querySelectorAll('td[data-label="SLA e prazo"] .badge')].map(b => (b as HTMLElement).textContent?.trim());
      expect(badges).toEqual(['Em risco', 'Cumprido']);
    });
  });

  describe('SLA cards', () => {
    it('gives each card button the number together with the label, so screen reader users hear the count', async () => {
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();

      const labels = [...fixture.nativeElement.querySelectorAll('app-stat-card button[aria-pressed]')].map(b => (b as HTMLElement).getAttribute('aria-label'));
      expect(labels).toContain('Atrasados: 1. Filtrar a tabela');
      expect(labels).toContain('Ativos: 10. Filtrar a tabela');
    });

    it('a second click on the already pressed card undoes the SLA filter, without touching the status or the sorting', async () => {
      storeFake.filters.set({ ...storeFake.filters(), activeOnly: true, slaStatus: TicketSlaStatus.Breached });
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();

      fixture.componentInstance.onSlaCardClick(TicketSlaStatus.Breached);

      expect(storeFake.setSlaStatus).toHaveBeenCalledWith(undefined);
      expect(storeFake.setStatus).not.toHaveBeenCalled();
      expect(storeFake.setSort).not.toHaveBeenCalled();
    });
  });

  describe('list age and "Atualizar"', () => {
    it('states the time of the last load and reloads the list and numbers via the "Atualizar" button', async () => {
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.card-header').textContent).toContain('Atualizado às');
      storeFake.load.calls.reset();
      (fixture.nativeElement.querySelector('.monitor-refresh') as HTMLButtonElement).click();

      expect(storeFake.load).toHaveBeenCalled();
      expect(storeFake.reloadSlaSummary).toHaveBeenCalled();
    });

    it('when returning to the tab with a list older than 5 minutes, reloads by itself; with a recent list, it does not', async () => {
      spyOnProperty(document, 'visibilityState').and.returnValue('visible');
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();
      storeFake.load.calls.reset();

      document.dispatchEvent(new Event('visibilitychange'));
      expect(storeFake.load).not.toHaveBeenCalled();

      storeFake.listLoadedAtMs.set(Date.now() - 6 * 60_000);
      document.dispatchEvent(new Event('visibilitychange'));
      expect(storeFake.load).toHaveBeenCalled();
      expect(storeFake.reloadSlaSummary).toHaveBeenCalled();
    });
  });

  describe('list error', () => {
    it('with no list on screen, the failure takes the place of the table (never the "Ainda não há chamados" empty state), in a neutral tone', async () => {
      storeFake.tickets.set([]);
      storeFake.filters.set({ sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 });
      storeFake.listState.set({ loading: false, error: 'Erro ao carregar chamados' });
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();

      const body = fixture.nativeElement.querySelector('tbody') as HTMLElement;
      expect(body.textContent).toContain('Erro ao carregar chamados');
      expect(body.textContent).not.toContain('Ainda não há chamados');
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
      (body.querySelector('button') as HTMLButtonElement).click();
      expect(storeFake.load).toHaveBeenCalled();
    });

    it('with the list already on screen, keeps the rows and warns above them, without red', async () => {
      storeFake.listState.set({ loading: false, error: 'Erro ao carregar chamados' });
      const fixture = TestBed.createComponent(TicketMonitorComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('tr.ticket-row').length).toBe(1);
      const notice = [...fixture.nativeElement.querySelectorAll('p[role="alert"]')].find(p => (p as HTMLElement).textContent?.includes('Erro ao carregar chamados')) as HTMLElement;
      expect(notice.textContent).toContain('A lista abaixo é a da última atualização.');
      expect(notice.classList).not.toContain('text-danger');
    });
  });

  it('when clearing the filters, also removes the rejected date warning', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.dateError.set('from');

    fixture.componentInstance.onClearFilters();

    expect(fixture.componentInstance.dateError()).toBeNull();
    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('with the panel open, marks the table as compact (Solicitante and Setor are hidden on desktop)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('table') as HTMLElement;
    expect(table.classList).not.toContain('is-compact');

    fixture.componentInstance.selectedTicketId.set(ticket.id);
    await fixture.whenStable();

    expect(table.classList).toContain('is-compact');
    expect(fixture.nativeElement.querySelector('button.ticket-select').classList).not.toContain('text-break');
  });
});
