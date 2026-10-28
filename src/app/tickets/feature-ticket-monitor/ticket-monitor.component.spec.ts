import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TicketMonitorComponent } from './ticket-monitor.component';
import { By } from '@angular/platform-browser';
import { TicketAssignDialogComponent } from '../ui/ticket-assign-dialog/ticket-assign-dialog.component';
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
import { Department, DepartmentsStore } from '../../departments';
import { SessionService, ToastService } from '../../shared';
import { UserSummary } from '../../users';

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
      filters: signal<TicketMonitorFilters>({ sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }),
      tickets: signal<TicketMonitorItem[]>([ticket]),
      listState: signal({ loading: false, error: null as string | null }),
      slaSummary: signal<TicketSlaSummary | undefined>(slaSummary),
      slaSummaryState: signal({ loading: false, error: null as string | null }),
      currentPage: signal(1),
      currentPageSize: signal(20),
      total: signal(1),
      totalPages: signal(1),
      hasPreviousPage: signal(false),
      hasNextPage: signal(false),
      assigningToMeIds: signal<string[]>([]),
      mutationError: signal<string | null>(null),
      responsibleCandidates: signal<UserSummary[]>([]),
      searchingResponsibleCandidates: signal(false),
      responsibleSearchError: signal<string | null>(null),
      assigningResponsible: signal(false),
      load: jasmine.createSpy('load'),
      reloadSlaSummary: jasmine.createSpy('reloadSlaSummary'),
      clearMutationError: jasmine.createSpy('clearMutationError'),
      setStatus: jasmine.createSpy('setStatus'),
      setPriority: jasmine.createSpy('setPriority'),
      setSectorId: jasmine.createSpy('setSectorId'),
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
      select: jasmine.createSpy('select')
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
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  it('carrega os chamados ao inicializar, sem recarregar os departamentos (o store já os carrega sozinho)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
    expect(departmentsStoreFake.load).not.toHaveBeenCalled();
  });

  it('restaura os filtros, ordenação e página a partir da query string ao inicializar (RF-28)', async () => {
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
      status: TicketStatus.Open, activeOnly: undefined, priority: TicketPriority.High, sectorId: 's1',
      slaStatus: TicketSlaStatus.AtRisk, unassignedOnly: true, assignedToUserId: undefined,
      sort: TicketSortOrder.DueDate, page: 3, pageSize: 50
    });
  });

  it('volta ao padrão quando um parâmetro da URL é inválido (fora do enum, não numérico etc.), sem quebrar (EC-08)', async () => {
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
      status: undefined, activeOnly: undefined, priority: undefined, sectorId: undefined, slaStatus: undefined,
      unassignedOnly: undefined, assignedToUserId: undefined, sort: TicketSortOrder.Newest, page: 1, pageSize: 20
    });
  });

  it('"?status=active" (backlog e críticos do Início) vira o grupo Ativos: Aberto + Em Andamento', async () => {
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

  it('"?assignedToMe=true" (atalho do Início) vira o filtro de quem está logado, sem o id na URL', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ assignedToMe: 'true' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(storeFake.hydrateFiltersFromUrl).toHaveBeenCalledWith(jasmine.objectContaining({ assignedToUserId: 'u-current' }));
  });

  it('restaura o chamado selecionado a partir do "ticketId" da query string ao inicializar', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ ticketId: 't1' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedTicketId()).toBe('t1');
  });

  it('reflete o chamado selecionado na URL, sem navegar pra outra rota', async () => {
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

  it('não inclui o termo de busca livre na URL (RNF-32 proíbe texto livre na query string)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    storeFake.filters.set({ search: 'maria@empresa.com', status: TicketStatus.Open, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 });

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalled();
    const queryParams = navigateSpy.calls.mostRecent().args[1]!.queryParams as Record<string, unknown>;
    expect(Object.keys(queryParams)).not.toContain('search');
    expect(queryParams['status']).toBe(TicketStatus.Open);
  });

  it('reflete filtro/ordenação/página não-padrão na URL, sem empilhar histórico', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    storeFake.filters.set({ status: TicketStatus.Open, sort: TicketSortOrder.Newest, page: 2, pageSize: 20 });

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ status: TicketStatus.Open, page: 2 }),
      replaceUrl: true
    }));
  });

  it('não navega de novo quando os filtros já batem com a URL atual (evita loop)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('lista os setores do departamento no filtro, a partir do que já está no DepartmentsStore', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const sectorOptions = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#monitorSector option')
    ).map(option => option.textContent?.trim());

    expect(sectorOptions).toContain('Suporte');
  });

  it('renderiza os chamados carregados, com solicitante, setor, prioridade, status e SLA', async () => {
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

  it('o link "Ver detalhes" leva pro chamado com ?from=monitor, pra o detalhe saber de onde o usuário veio', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const detailLink = fixture.nativeElement.querySelector('a[aria-label^="Ver detalhes"]') as HTMLAnchorElement;
    expect(detailLink.getAttribute('href')).toBe('/tickets/t1?from=monitor');
  });

  it('seleciona um chamado ao clicar na linha, e desseleciona ao clicar de novo na mesma linha', async () => {
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

  it('seleciona pelo botão do título (teclado/leitor de tela) sem alternar duas vezes pelo clique da linha', async () => {
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

  it('dá ao botão do título o texto visível como nome acessível, sem rótulo que repita o estado (WCAG 2.5.3)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const selectButton = fixture.nativeElement.querySelector('tbody tr.ticket-row .ticket-select') as HTMLButtonElement;
    expect(selectButton.hasAttribute('aria-label')).toBeFalse();
    expect(selectButton.hasAttribute('aria-pressed')).toBeFalse();
    expect(selectButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('não alterna a seleção da linha ao clicar no botão de ação "Atribuir a mim"', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    const assignButton = row.querySelector('button[aria-label^="Atribuir o chamado"]') as HTMLButtonElement;
    assignButton.click();
    await fixture.whenStable();

    expect(row.querySelector('.ticket-select')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('mostra o painel "Informações do Chamado" ao selecionar um chamado, e repassa a seleção pro TicketQuickInfoStore', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeTruthy();
    expect(quickInfoStoreFake.select).toHaveBeenCalledWith('t1');
  });

  it('não mostra o painel quando o chamado selecionado não está (mais) na página/filtro atual', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ ticketId: 'inexistente' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-monitor-info-panel')).toBeNull();
  });

  it('fecha o painel e limpa a seleção ao receber o evento "close"', async () => {
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

  it('fecha o painel com a tecla Esc, de qualquer lugar da tela, e devolve o foco a quem o abriu', async () => {
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

  it('não faz nada ao apertar Esc sem nenhum painel aberto', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))).not.toThrow();
  });

  it('fecha o painel ao clicar no backdrop (overlay de telas pequenas), e devolve o foco a quem o abriu', async () => {
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

  it('mostra o Guia da Tela logo abaixo do cabeçalho, antes do resumo de SLA e da tabela, fora da coluna da tabela', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const html = fixture.nativeElement.innerHTML as string;
    const headerIndex = html.indexOf('<app-page-header');
    const guideIndex = html.indexOf('<app-ticket-monitor-guide');
    const slaIndex = html.indexOf('monitor-scope');
    const tableIndex = html.indexOf('<table');

    expect(headerIndex).toBeGreaterThanOrEqual(0);
    expect(guideIndex).toBeGreaterThan(headerIndex);
    expect(guideIndex).toBeLessThan(slaIndex);
    expect(guideIndex).toBeLessThan(tableIndex);
    expect(fixture.nativeElement.querySelector('.row app-ticket-monitor-guide')).toBeNull();
  });

  it('mostra "Não atribuído" quando o chamado não tem atendente, e o nome quando tem', async () => {
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

  it('mostra "Atribuir a mim" só pra chamado ativo sem responsável, e chama store.assignToMe com o usuário logado', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', assignedToUserId: null, status: TicketStatus.Open },
      { ...ticket, id: 't2', assignedToUserId: 'u2', assignedToName: 'Carlos Souza', status: TicketStatus.Open },
      { ...ticket, id: 't3', assignedToUserId: null, status: TicketStatus.Resolved }
    ]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const assignButtons = fixture.nativeElement.querySelectorAll('button[aria-label^="Atribuir o chamado"]') as NodeListOf<HTMLButtonElement>;
    expect(assignButtons.length).withContext('só o chamado t1 (ativo e sem responsável) deve ter o botão').toBe(1);

    assignButtons[0].click();
    expect(storeFake.assignToMe).toHaveBeenCalledWith('t1', 'u-current', jasmine.any(Function));
  });

  it('mostra um toast de confirmação ao atribuir "a mim" com sucesso', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const assignButton = fixture.nativeElement.querySelector('button[aria-label^="Atribuir o chamado"]') as HTMLButtonElement;
    assignButton.click();

    const onSuccess = storeFake.assignToMe.calls.mostRecent().args[2] as () => void;
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado atribuído a você.');
  });

  it('não mostra "Atribuir a mim" sem a permissão tickets:manage', async () => {
    hasPermission.and.returnValue(false);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button[aria-label^="Atribuir o chamado"]')).toBeNull();
  });

  it('desabilita e mostra um spinner só no botão do chamado que está sendo atribuído', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', assignedToUserId: null, status: TicketStatus.Open },
      { ...ticket, id: 't2', assignedToUserId: null, status: TicketStatus.Open }
    ]);
    storeFake.assigningToMeIds.set(['t1']);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const assignButtons = Array.from(fixture.nativeElement.querySelectorAll('button[aria-label^="Atribuir o chamado"]') as NodeListOf<HTMLButtonElement>);
    expect(assignButtons[0].disabled).toBeTrue();
    expect(assignButtons[0].querySelector('.spinner-border')).toBeTruthy();
    expect(assignButtons[1].disabled).toBeFalse();
    expect(assignButtons[1].querySelector('.spinner-border')).toBeFalsy();
  });

  it('mostra a mensagem de erro de atribuição quando falhar', async () => {
    storeFake.mutationError.set('Não foi possível atribuir — o chamado pode já ter outro responsável ou ter mudado de status. Tente novamente.');
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('já ter outro responsável');
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

  it('põe o Setor acima dos números de SLA, explicando que eles só mudam com o setor', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const sector = fixture.nativeElement.querySelector('#monitorSector') as HTMLSelectElement;
    const hint = fixture.nativeElement.querySelector(`#${sector.getAttribute('aria-describedby')}`) as HTMLElement;
    expect(hint.textContent).toContain('Os números ignoram os outros filtros');
    expect(sector.compareDocumentPosition(fixture.nativeElement.querySelector('app-stat-card')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sector.closest('app-filter-bar')).toBeNull();
  });

  it('recolhe Prioridade e Ordenar em "Mais filtros", com a contagem dos aplicados', async () => {
    storeFake.filters.set({ ...storeFake.filters(), priority: 3, sort: TicketSortOrder.DueDate });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const more = fixture.nativeElement.querySelector('.btn-more-filters') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('#monitorMoreFilters').hidden).toBeTrue();
    expect(more.textContent).toContain('Mais filtros (2)');

    more.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#monitorMoreFilters').hidden).toBeFalse();
    expect(more.getAttribute('aria-expanded')).toBe('true');
  });

  it('separa os estados de SLA "em monitoramento" dos "já resolvidos" no dropdown, em optgroups distintos', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const groups = Array.from(fixture.nativeElement.querySelectorAll('#monitorSla optgroup') as NodeListOf<HTMLOptGroupElement>);
    expect(groups.map(g => g.label)).toEqual(['Em monitoramento', 'Já resolvidos']);

    const liveOptions = Array.from(groups[0].querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(o => o.textContent?.trim());
    expect(liveOptions).toEqual(['No prazo', 'Em risco', 'Atrasado']);

    const resolvedOptions = Array.from(groups[1].querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(o => o.textContent?.trim());
    expect(resolvedOptions).toEqual(['Cumprido', 'Resolvido com atraso', 'Sem SLA']);
  });

  it('mostra o estado vazio quando não há chamados', async () => {
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado encontrado com esses filtros.');
  });

  it('oferece "Limpar filtros" no estado vazio, e limpa ao clicar', async () => {
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement).click();

    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('não fecha o painel quando o Esc nasce dentro de um modal (só fecha o modal)', async () => {
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

  it('passa o painel pro modo modal (overlay) só abaixo de "lg"', async () => {
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

  it('mostra a mensagem de erro do store, com botão para tentar novamente', async () => {
    storeFake.listState.set({ loading: false, error: 'Você não tem permissão para monitorar os chamados do sistema.' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para monitorar os chamados do sistema.');

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(storeFake.load).toHaveBeenCalledTimes(2); // 1x no ngOnInit, 1x no clique
  });

  it('filtra pelo SLA ao clicar num card de resumo, e marca o card ativo como pressionado', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.stat-press') as NodeListOf<HTMLButtonElement>;
    expect(cards.length).toBe(4);
    expect(cards[0].getAttribute('aria-pressed')).toBe('true'); // "Ativos": sem filtro de SLA é o padrão

    cards[3].click(); // "Atrasados"
    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(TicketSlaStatus.Breached);

    cards[0].click(); // "Ativos" limpa o filtro de SLA
    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(undefined);
  });

  it('ao clicar num card de resumo de SLA, também ordena por prazo mais próximo (urgência)', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.stat-press') as NodeListOf<HTMLButtonElement>;
    cards[2].click(); // "Em Risco"

    expect(storeFake.setSlaStatus).toHaveBeenCalledWith(TicketSlaStatus.AtRisk);
    expect(storeFake.setSort).toHaveBeenCalledWith(TicketSortOrder.DueDate);
  });

  it('muda o status selecionado', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('#monitorStatus') as HTMLSelectElement;
    select.value = String(TicketStatus.Open);
    select.dispatchEvent(new Event('change'));

    expect(storeFake.setStatus).toHaveBeenCalledWith(TicketStatus.Open);
  });

  it('o filtro "Responsável" aplica "Atribuídos a mim" (com o id de quem está logado), "Sem responsável" e "Qualquer um"', async () => {
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

  it('anuncia o carregamento da tabela por leitor de tela e tem uma legenda acessível', async () => {
    storeFake.tickets.set([]);
    storeFake.listState.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table caption')).not.toBeNull();
    const status = fixture.nativeElement.querySelector('app-loading-state') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toContain('Carregando chamados');
  });

  it('mantém a lista atual visível (só esmaecida) ao recarregar com filtro/página, em vez de sumir com tudo', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    storeFake.listState.set({ loading: true, error: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
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

    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toContain('Exibindo 21–40 de');
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

  it('indica um chamado atrasado quando o prazo já passou e não foi resolvido', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const overdueTicket: TicketMonitorItem = { ...ticket, dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: null };
    const resolvedTicket: TicketMonitorItem = { ...ticket, id: 't2', dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: '2020-01-01T00:00:00Z' };

    expect(fixture.componentInstance.isOverdue(overdueTicket)).toBeTrue();
    expect(fixture.componentInstance.isOverdue(resolvedTicket)).toBeFalse();
  });

  it('mostra um ícone de alerta na célula de prazo atrasado, não só a cor', async () => {
    storeFake.tickets.set([{ ...ticket, dueAtUtc: '2020-01-01T00:00:00Z', resolvedAtUtc: null }]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const dueDateCell = fixture.nativeElement.querySelector('td.text-danger');
    expect(dueDateCell?.querySelector('.bx-error-circle')).withContext('a célula atrasada deve ter um ícone, não só cor').toBeTruthy();
  });

  it('mostra "Atribuir responsável" pra chamado ativo, com ou sem responsável atual', async () => {
    storeFake.tickets.set([
      { ...ticket, id: 't1', status: TicketStatus.Open, assignedToUserId: null },
      { ...ticket, id: 't2', status: TicketStatus.Open, assignedToUserId: 'u2', assignedToName: 'Carlos Souza' },
      { ...ticket, id: 't3', status: TicketStatus.Resolved, assignedToUserId: null }
    ]);
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button[aria-label*="responsável pelo chamado"]') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).withContext('só os chamados ativos (t1, t2) devem ter o botão').toBe(2);
  });

  it('abre o diálogo "Atribuir responsável" pro chamado clicado, sem herdar a busca de uma abertura anterior', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const openButton = fixture.nativeElement.querySelector('button[aria-label*="responsável pelo chamado"]') as HTMLButtonElement;
    openButton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.assigningResponsibleTicketId()).toBe('t1');
    expect(storeFake.clearResponsibleSearch).toHaveBeenCalled();
    const dialog = fixture.debugElement.query(By.directive(TicketAssignDialogComponent)).componentInstance as TicketAssignDialogComponent;
    expect(dialog.ticketTitle()).toBe(ticket.title);
  });

  it('busca por título com debounce de 300ms após parar de digitar, sem buscar a cada letra', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#monitorSearch') as HTMLInputElement;
    input.value = 'impressora';
    input.dispatchEvent(new Event('input'));

    expect(storeFake.setSearch).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 350));

    expect(storeFake.setSearch).toHaveBeenCalledWith('impressora');
  });

  it('ao limpar os filtros, também limpa o texto de busca ainda não aplicado', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.searchInput.set('impressora');

    const clearButton = fixture.nativeElement.querySelector('.btn-clear-filters') as HTMLButtonElement;
    clearButton.click();

    expect(fixture.componentInstance.searchInput()).toBe('');
    expect(storeFake.clearFilters).toHaveBeenCalled();
  });

  it('mostra o erro do resumo de SLA com botão de tentar novamente', async () => {
    storeFake.slaSummaryState.set({ loading: false, error: 'Erro ao carregar o resumo de SLA' });
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o resumo de SLA');

    const retryButton = fixture.nativeElement.querySelector('.alert-danger button') as HTMLButtonElement;
    retryButton.click();

    expect(storeFake.reloadSlaSummary).toHaveBeenCalled();
  });

  it('permite fechar o alerta de erro de atribuição', async () => {
    storeFake.mutationError.set('Não foi possível atribuir.');
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const closeButton = fixture.nativeElement.querySelector('.alert-danger .btn-close') as HTMLButtonElement;
    closeButton.click();

    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('agrupa as ações da linha (atribuir/ver detalhes) num único menu "⋮", em vez de botões soltos', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.ticket-row') as HTMLTableRowElement;
    expect(row.querySelector('.dropdown-menu')).toBeTruthy();
    expect(row.querySelectorAll('[data-bs-toggle="dropdown"]').length).toBe(1);
  });

  it('liga a busca do diálogo ao store e atribui o candidato confirmado, com toast, fechando o diálogo', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();
    fixture.componentInstance.onOpenAssignResponsibleModal('t1');
    await fixture.whenStable();

    const dialog = fixture.debugElement.query(By.directive(TicketAssignDialogComponent)).componentInstance as TicketAssignDialogComponent;
    dialog.search.emit('joão');
    expect(storeFake.searchResponsibleCandidates).toHaveBeenCalledWith('joão');

    dialog.confirm.emit({ userId: 'u2', name: 'João Pedro' });
    expect(storeFake.assignResponsible).toHaveBeenCalledWith('t1', 'u2', jasmine.any(Function));

    const onSuccess = storeFake.assignResponsible.calls.mostRecent().args[2] as () => void;
    onSuccess();
    await fixture.whenStable();

    expect(toastServiceFake.show).toHaveBeenCalledWith('João Pedro agora é o responsável.');
    expect(fixture.debugElement.query(By.directive(TicketAssignDialogComponent))).toBeNull();
  });

  it('não dispara a atribuição se nenhum chamado estiver com o diálogo aberto', async () => {
    const fixture = TestBed.createComponent(TicketMonitorComponent);
    await fixture.whenStable();

    fixture.componentInstance.onConfirmResponsible({ userId: 'u2', name: 'João Pedro' });

    expect(storeFake.assignResponsible).not.toHaveBeenCalled();
  });
});
