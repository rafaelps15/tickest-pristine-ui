import { TestBed } from '@angular/core/testing';
import { computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { DashboardComponent, countTrend, greetingForHour, slaRate } from './dashboard.component';
import { DASHBOARD_REFRESH_MS } from './dashboard-auto-refresh';
import { MyTicketsSummaryStore, TicketSummaryStore, TicketDashboardStore, TicketAssigneesStore, TicketAssignee, TicketAverageTimes, TicketDashboardOverview, TicketDashboardVolume, TicketDashboardSla, TicketDashboardAttention, TicketVolumeGrouping, TicketVolumePoint, TicketMonitorItem, TicketStatusCounts, TicketDashboardChartScope } from '../tickets';
import { DepartmentsStore, Department } from '../departments';
import { SessionService, ToastService } from '../shared';

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
  /** Se a tela pediu o store de "Seus chamados" (ele busca sozinho ao nascer). */
  let myTicketsCreated: boolean;

  /** Quem atende a fila, como o papel Atendente (que também abre e vê os próprios chamados). */
  const asAgent = () => hasPermission.and.callFake((code: string) =>
    code === 'tickets:manage' || code === 'tickets:create' || code === 'tickets:view-own');
  /** Quem abre chamados e vê os próprios. */
  const asRequester = () => hasPermission.and.callFake((code: string) => code === 'tickets:view-own' || code === 'tickets:create');

  beforeEach(async () => {
    ticketsStoreFake = createTicketsStoreFake();
    operationFake = createOperationStoreFake();
    myTicketsFake = createMyTicketsFake();
    myTicketsCreated = false;
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);
    currentUser = signal<CurrentUserFake>({ firstName: 'Maria', roles: [{ name: 'Colaborador' }] });
    toastServiceFake = { show: jasmine.createSpy('show') };
    departmentsFake = {
      departments: signal<Department[]>([{ id: 'd1', name: 'TI', description: '', responsibleUserId: null, responsibleUserName: null, activeTicketCount: 0, sectors: [{ id: 's1', name: 'Helpdesk', description: null, activeTicketCount: 0 }, { id: 's2', name: 'Infra', description: null, activeTicketCount: 0 }] }]),
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
        { provide: SessionService, useValue: { hasPermission, currentUser, userId: signal<string | null>('u-me') } },
        { provide: ToastService, useValue: toastServiceFake }
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

  describe('greeting', () => {
    it('greets by first name according to the time of day', async () => {
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain(`${greetingForHour(new Date().getHours())}, Maria!`);
    });

    it('greets without a name when the logged-in user has not been loaded yet', async () => {
      currentUser.set(null);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe(`${greetingForHour(new Date().getHours())}!`);
    });

    it('picks "Bom dia", "Boa tarde" or "Boa noite" by the hour (early morning counts as night)', () => {
      expect(greetingForHour(8)).toBe('Bom dia');
      expect(greetingForHour(13)).toBe('Boa tarde');
      expect(greetingForHour(20)).toBe('Boa noite');
      expect(greetingForHour(2)).toBe('Boa noite');
    });
  });

  describe('header', () => {
    it('loads the numbers when the screen opens', async () => {
      await render();
      expect(ticketsStoreFake.load).toHaveBeenCalled();
    });

    it('when opening (or returning to) the screen, reloads all sources, not just the totals, since the stores keep the previous visit', async () => {
      asRequester();
      await render();
      expect(ticketsStoreFake.load).toHaveBeenCalledTimes(1);
      expect(operationFake.refresh).toHaveBeenCalledTimes(1);
      expect(myTicketsFake.reload).toHaveBeenCalledTimes(1);
    });

    it('when returning to the screen with the numbers from the previous visit, says "Atualizando…" (never "Atualizado agora") until the reload finishes', async () => {
      asRequester();
      ticketsStoreFake.statusCountsLoading.set(true);
      const fixture = await render();
      const label = () => (fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent?.trim();
      expect(label()).toContain('Atualizando…');
      expect(fixture.nativeElement.querySelector('.freshness-spinner')).not.toBeNull();

      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      expect(label()).toContain('Atualizado agora');
    });

    it('if the reload on return fails, says the numbers are from a previous visit', async () => {
      asRequester();
      ticketsStoreFake.statusCountsFailed.set(true);
      const fixture = await render();
      expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Falha ao atualizar · números de uma visita anterior');
    });

    it('the refresh button is aria-disabled (not disabled) while refreshing, so focus is not lost', async () => {
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

    it('with a block in error and no numbers (the Alertas), never says "Atualizado agora": says that not all numbers loaded', async () => {
      asAgent();
      ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
      const fixture = await render();
      const label = fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;

      expect(label.textContent).toContain('Nem todos os números carregaram');
      expect(label.textContent).not.toContain('Atualizado agora');
      expect(label.classList).toContain('freshness-failed');
    });

    it('when the block comes back, the header goes back to saying "Atualizado agora"', async () => {
      asAgent();
      ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
      const fixture = await render();

      ticketsStoreFake.criticalTicketsError.set(null);
      ticketsStoreFake.criticalTicketsLoading.set(true);
      await fixture.whenStable();
      ticketsStoreFake.criticalTicketsLoading.set(false);
      await fixture.whenStable();

      const label = fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;
      expect(label.textContent).toContain('Atualizado agora');
      expect(label.classList).not.toContain('freshness-failed');
    });

    it('a refresh that ends with a block in error (without numbers) announces the failure, not "Atualizado agora"', async () => {
      asAgent();
      const fixture = await render();
      const live = () => (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
      ticketsStoreFake.criticalTicketsLoading.set(true);
      await fixture.whenStable();
      ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
      ticketsStoreFake.criticalTicketsLoading.set(false);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(live()).toBe('Não foi possível atualizar os números');
      expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Nem todos os números carregaram');
    });

    it('"Seus chamados" in error without numbers also prevents "Atualizado agora"', async () => {
      asRequester();
      myTicketsFake.failed.set(true);
      myTicketsFake.totalCount.set(null);
      const fixture = await render();

      expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Nem todos os números carregaram');
    });

    /** Falha total pra quem atende a fila: agregado, fluxo e Alertas em erro, e nenhum bloco com números (nem os tempos). */
    const failEverything = () => {
      asAgent();
      operationFake.volume.set(null);
      operationFake.overviewError.set('Não foi possível carregar os números da operação.');
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsFailed.set(true);
      ticketsStoreFake.volumeHasValue.set(false);
      ticketsStoreFake.volumeFailed.set(true);
      ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
      operationFake.times.set(null);
    };

    it('with some blocks having numbers and another in error, the failure is partial: "Nem todos os números carregaram", with the failure mark', async () => {
      asAgent();
      ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
      const fixture = await render();
      const label = fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;

      expect(label.textContent).toContain('Nem todos os números carregaram');
      expect(label.textContent).not.toContain('Não foi possível carregar os números');
      expect(label.querySelector('.bx-error-circle')).not.toBeNull();
    });

    it('with no block having numbers and nothing loading, the failure is total: "Não foi possível carregar os números", never "Nem todos"', async () => {
      failEverything();
      const fixture = await render();
      const label = fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;

      expect(label.textContent).toContain('Não foi possível carregar os números');
      expect(label.textContent).not.toContain('Nem todos os números carregaram');
      expect(label.textContent).not.toContain('Atualizado agora');
      expect(label.classList).toContain('freshness-failed');
      expect(label.querySelector('.bx-error-circle')).not.toBeNull();
    });

    it('after a total failure, when the numbers come back, the header goes back to "Atualizado agora", without the failure mark', async () => {
      failEverything();
      const fixture = await render();

      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();
      operationFake.volume.set({ totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0, backlogCount: 5 });
      operationFake.overviewError.set(null);
      ticketsStoreFake.volumeHasValue.set(true);
      ticketsStoreFake.volumeFailed.set(false);
      ticketsStoreFake.criticalTicketsError.set(null);
      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();

      const label = fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;
      expect(label.textContent).toContain('Atualizado agora');
      expect(label.classList).not.toContain('freshness-failed');
    });

    it('on total failure, the requested "Atualizar" ends with an announcement to the screen reader (before, silence)', async () => {
      failEverything();
      const fixture = await render();
      const live = () => (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();
      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(live()).toBe('Não foi possível carregar os números');
    });

    it('total failure, retry, failure again, retry, recovery: "Atualizando…" while loading, never "Nem todos" in passing', async () => {
      failEverything();
      const fixture = await render();
      const label = () => fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;
      const live = () => (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();
      const refresh = () => fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement;
      const settleAnnouncement = () => new Promise(resolve => setTimeout(resolve, 150));
      expect(label().textContent).toContain('Não foi possível carregar os números');

      // Nova tentativa: carregando, sem números, com a falha anterior ainda valendo.
      refresh().click();
      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();
      expect(label().textContent).toContain('Atualizando…');
      expect(label().textContent).not.toContain('Nem todos os números carregaram');
      expect(label().querySelector('.freshness-spinner')).not.toBeNull();
      expect(label().classList).not.toContain('freshness-failed');
      expect(refresh().getAttribute('aria-disabled')).toBe('true');

      // A falha persiste: volta o estado de falha total, e quem pediu ouve isso.
      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      await settleAnnouncement();
      expect(label().textContent).toContain('Não foi possível carregar os números');
      expect(label().classList).toContain('freshness-failed');
      expect(label().querySelector('.bx-error-circle')).not.toBeNull();
      expect(live()).toBe('Não foi possível carregar os números');

      // Outra tentativa, que dá certo.
      refresh().click();
      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();
      expect(label().textContent).toContain('Atualizando…');
      operationFake.volume.set({ totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0, backlogCount: 5 });
      operationFake.overviewError.set(null);
      ticketsStoreFake.volumeHasValue.set(true);
      ticketsStoreFake.volumeFailed.set(false);
      ticketsStoreFake.criticalTicketsError.set(null);
      ticketsStoreFake.statusCountsLoading.set(false);
      await fixture.whenStable();
      await settleAnnouncement();
      expect(label().textContent).toContain('Atualizado agora');
      expect(label().classList).not.toContain('freshness-failed');
      expect(live()).toBe('Atualizado agora');
    });

    it('with numbers on screen and a block in error, the refresh in progress keeps saying "Nem todos os números carregaram" (with the indicator and the mark)', async () => {
      asAgent();
      ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
      const fixture = await render();
      const label = () => fixture.nativeElement.querySelector('.freshness-label') as HTMLElement;

      ticketsStoreFake.statusCountsLoading.set(true);
      await fixture.whenStable();

      expect(label().textContent).toContain('Nem todos os números carregaram');
      expect(label().textContent).not.toContain('Atualizando…');
      expect(label().querySelector('.freshness-spinner')).not.toBeNull();
      expect(label().classList).toContain('freshness-failed');
    });

    it('a first load that fails entirely announces nothing on its own (the error notices of the blocks already speak)', async () => {
      failEverything();
      const fixture = await render();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect((fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim()).toBe('');
    });

    it('has the "Guia da tela" button in the header, and the guide no longer takes up the body of the screen', async () => {
      const fixture = await render();
      const header = fixture.nativeElement.querySelector('app-page-header') as HTMLElement;
      expect(header.querySelector('.guide-trigger')?.textContent).toContain('Guia da tela');
      expect(fixture.nativeElement.querySelector('app-screen-guide')).toBeNull();
    });

    it('says the age of the numbers and refreshes everything immediately via the button, keeping the numbers on screen', async () => {
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

    it('announces only "Atualizado agora" to the screen reader when a refresh finishes, never the numbers', async () => {
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

  describe('top indicators (whole company)', () => {
    it('for those who work the queue: overdue and unassigned first, with an alert background, and the split by status only in the bar', async () => {
      asAgent();
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
      expect(fixture.nativeElement.querySelectorAll('.kpi-value')[0].classList).toContain('kpi-risk');
      expect(kpiLink(fixture.nativeElement, 'Atrasados').getAttribute('href')).toContain('slaStatus=3');
      expect(kpiLink(fixture.nativeElement, 'Sem responsável').getAttribute('href')).toContain('unassignedOnly=true');
      expect(texts.some(text => text.includes('Fechados'))).toBeFalse();
    });

    it('zero overdue stays neutral (no risk color, no alert background)', async () => {
      asAgent();
      operationFake.attention.set({ breachedCount: 0, criticalCount: 1, unassignedCount: 3 });
      const fixture = await render();

      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Atrasados 0');
      expect(fixture.nativeElement.querySelectorAll('.kpi-value')[0].classList).not.toContain('kpi-risk');
      expect(fixture.nativeElement.querySelectorAll('.kpi-card')[0].classList).not.toContain('kpi-alert-danger');
    });

    it('for those who do not work the queue, the SLA rate says "em breve" (neutral, no error)', async () => {
      asRequester();
      const fixture = await render();
      expect(kpiTexts(fixture.nativeElement)[5]).toContain('SLA cumprido Disponível em breve');
    });

    it('each number leads to the queue with its status and the URL filters', async () => {
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

    it('loading: skeleton of the same size, with no made-up number', async () => {
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsLoading.set(true);
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('.kpi-strip[aria-busy="true"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.kpi-skeleton').length).toBe(5);
    });

    it('real error: a neutral notice with "Tentar novamente", without red', async () => {
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

    it('server message in the error (e.g. no permission), not the generic one', async () => {
      ticketsStoreFake.statusCounts.set(null);
      ticketsStoreFake.statusCountsFailed.set(true);
      ticketsStoreFake.summaryError.set('Você não tem permissão para ver os números da empresa.');
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-kpi-strip').textContent).toContain('Você não tem permissão para ver os números da empresa.');
    });

    it('on a failed refresh, the previous numbers stay and the header says how old they are', async () => {
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

    it('large numbers in compact pt-BR, with the full number at hand', async () => {
      ticketsStoreFake.statusCounts.set({ totalCount: 12345, openCount: 1200, inProgressCount: 0, resolvedCount: 11145, closedCount: 0, canceledCount: 0 });
      const fixture = await render();

      const total = fixture.nativeElement.querySelector('.kpi-value') as HTMLElement;
      expect(total.textContent?.trim()).toMatch(/^12,3\smil$/);
      expect(total.getAttribute('title')).toBe('12.345');
    });
  });

  describe('main chart', () => {
    it('shows the current composition with numbers and percentages, and the canceled ones left out of the bar so the sum adds up', async () => {
      asAgent();
      operationFake.volume.set({ totalCount: 12, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 2, backlogCount: 5 });
      const fixture = await render();
      // A legenda mora dentro da barra: cada fatia diz status, número e percentual.
      const items = Array.from(fixture.nativeElement.querySelectorAll('.composition-segment .segment-full') as NodeListOf<HTMLElement>)
        .map(span => span.textContent?.replace(/\s+/g, ' ').trim());

      expect(items).toEqual(['Abertos 3 · 30%', 'Andamento 2 · 20%', 'Resolvidos 4 · 40%', 'Fechados 1 · 10%']);
      expect(fixture.nativeElement.querySelector('.composition-canceled').textContent.trim()).toBe('+ 2 cancelados');
    });

    it('each slice leads to the status list (keyboard), and the bar has a description for the screen reader', async () => {
      asAgent();
      operationFake.volume.set({ totalCount: 12, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 2, backlogCount: 5 });
      const fixture = await render();

      const links = Array.from(fixture.nativeElement.querySelectorAll('.composition-segment a') as NodeListOf<HTMLAnchorElement>);
      expect(links.length).toBe(4);
      expect(links[0].getAttribute('href')).toContain('status=1');
      expect(links[0].getAttribute('aria-label')).toBe('Abertos: 3 chamados, 30%. Ver a lista');
      expect(fixture.nativeElement.querySelector('.composition-bar').getAttribute('aria-label')).toContain('abertos 3 (30%)');
      expect(fixture.nativeElement.querySelector('.composition-bar').getAttribute('aria-label')).toContain('mais 2 cancelados');
    });

    it('shows the highlight sentence when there is a sample, and no sentence when there is not', async () => {
      // 7 dias até ontem com 20 por dia (índices 22–28) contra 10 por dia antes: +100%.
      ticketsStoreFake.volume.set(thirtyDays().map((p, i) => ({ ...p, count: i >= 22 && i <= 28 ? 20 : 10 })));
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.hero-insight')?.textContent).toContain('70 chamados a mais (+100%) nos 7 dias até ontem');

      ticketsStoreFake.volume.set(thirtyDays(1));
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.hero-insight')).toBeNull();
    });

    it('the chart footer never promises the resolved ones ("em breve"): not on the first load, not on a flow error, not with the flow ready', async () => {
      ticketsStoreFake.volume.set([]);
      ticketsStoreFake.volumeHasValue.set(false);
      ticketsStoreFake.volumeLoading.set(true);
      const fixture = await render();
      const footnote = () => (fixture.nativeElement.querySelector('.hero-footnote') as HTMLElement).textContent ?? '';
      expect(footnote()).toContain('Todos os chamados da empresa · Últimos 30 dias');
      expect(footnote()).not.toContain('em breve');

      ticketsStoreFake.volumeLoading.set(false);
      ticketsStoreFake.volumeFailed.set(true);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.flow-area')?.textContent).toContain('Não foi possível carregar os chamados por período.');
      expect(footnote()).not.toContain('em breve');

      ticketsStoreFake.volumeFailed.set(false);
      ticketsStoreFake.volume.set(thirtyDays());
      ticketsStoreFake.volumeHasValue.set(true);
      await fixture.whenStable();
      expect(footnote()).toContain('Todos os chamados da empresa · Últimos 30 dias');
      expect(footnote()).not.toContain('em breve');
    });

    it('changing the grouping or the scope does not bring an "em breve" to the footer while the new flow loads', async () => {
      asAgent();
      const fixture = await render();
      const footnote = () => (fixture.nativeElement.querySelector('.hero-footnote') as HTMLElement).textContent ?? '';

      // Troca de agrupamento: o volume da empresa recarrega no agrupamento novo, ainda sem pontos.
      ticketsStoreFake.groupBy.set('Week');
      ticketsStoreFake.volume.set([]);
      ticketsStoreFake.volumeHasValue.set(false);
      ticketsStoreFake.volumeLoading.set(true);
      await fixture.whenStable();
      expect(footnote()).toContain('Todos os chamados da empresa · Últimas 12 semanas');
      expect(footnote()).not.toContain('em breve');

      // Troca de escopo: o volume do recorte ainda não chegou.
      operationFake.trend.set([]);
      operationFake.trendHasValue.set(false);
      operationFake.trendLoading.set(true);
      operationFake.chartScope.set('filtered');
      await fixture.whenStable();
      expect(footnote()).toContain('Chamados com os filtros · Últimos 30 dias');
      expect(footnote()).not.toContain('em breve');
    });

    it('empty: no tickets in the period', async () => {
      ticketsStoreFake.volume.set(thirtyDays(0));
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.flow-area')?.textContent).toContain('Nenhum chamado no período.');
    });

    it('flow error: a neutral notice and "Tentar novamente" on the right source, not the empty state', async () => {
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

    describe('first use (company with no tickets)', () => {
      beforeEach(() => {
        ticketsStoreFake.statusCounts.set({ totalCount: 0, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 });
        ticketsStoreFake.volume.set(thirtyDays(0));
      });

      it('invites those who can open tickets to open the first one', async () => {
        hasPermission.and.callFake((code: string) => code === 'tickets:create');
        const fixture = await render();
        expect(fixture.nativeElement.textContent).toContain('A empresa ainda não tem nenhum chamado.');
        expect(fixture.nativeElement.querySelector('.flow-area a[href="/tickets/novo"]')).not.toBeNull();
      });

      it('leads those who manage the structure to register departments and sectors first', async () => {
        hasPermission.and.callFake((code: string) => code === 'departments:manage');
        const fixture = await render();
        expect(fixture.nativeElement.querySelector('.flow-area a[href="/departamentos"]')).not.toBeNull();
      });
    });

    it('changes the grouping when clicking Semana', async () => {
      const fixture = await render();
      const week = Array.from(fixture.nativeElement.querySelectorAll('.hero-controls button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.trim() === 'Semana')!;
      week.click();
      expect(ticketsStoreFake.setGroupBy).toHaveBeenCalledWith('Week');
    });

    it('the accessible table shows the same numbers, receives focus and offers the drill-down by period', async () => {
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

    describe('"Resolvidos" series (spec 028)', () => {
      /** Abre a tela como atendente, com a resposta da empresa trazendo resolvedCount, e mostra a tabela. */
      async function tableHeaders(): Promise<(string | undefined)[]> {
        asAgent();
        ticketsStoreFake.volume.set(thirtyDays().map(point => ({ ...point, resolvedCount: 2 })));
        const fixture = await render();
        (fixture.nativeElement.querySelector('button[aria-label="Ver como tabela"]') as HTMLButtonElement).click();
        await fixture.whenStable();
        return Array.from(fixture.nativeElement.querySelectorAll('table th[scope="col"]') as NodeListOf<HTMLElement>).map(th => th.textContent?.trim());
      }

      it('shows the series when the response brings resolvedCount, with no flag', async () => {
        expect(await tableHeaders()).toContain('Resolvidos');
      });

      it('resolved tickets in the period do not make the chart "vazio"', async () => {
        ticketsStoreFake.volume.set(thirtyDays(0).map(point => ({ ...point, resolvedCount: 3 })));
        const fixture = await render();
        expect(fixture.nativeElement.querySelector('.flow-area')?.textContent).not.toContain('Nenhum chamado no período.');
      });

      it('the highlight sentence compares incoming and resolutions when the response brings them', async () => {
        ticketsStoreFake.volume.set(thirtyDays().map(point => ({ ...point, resolvedCount: 15 })));
        const fixture = await render();
        expect(fixture.nativeElement.querySelector('.hero-insight')?.textContent).toContain('Mais chamados resolvidos do que abertos nos 7 dias até ontem.');
      });

      it('with incoming and resolutions in balance, the sentence describes the two numbers and says nothing about the queue', async () => {
        ticketsStoreFake.volume.set(thirtyDays().map(point => ({ ...point, resolvedCount: 10 })));
        const fixture = await render();
        const insight = fixture.nativeElement.querySelector('.hero-insight')?.textContent?.trim();
        expect(insight).toBe('Tantos chamados resolvidos quanto abertos nos 7 dias até ontem.');
        expect(insight).not.toMatch(/fila/i);
      });
    });

    it('for those who work the queue, Empresa and Com filtros appear above the numbers (outside the chart) and switch the scope', async () => {
      asAgent();
      const fixture = await render();

      const group = fixture.nativeElement.querySelector('.scope-row [role="group"]') as HTMLElement;
      expect(group.getAttribute('aria-label')).toBe('Escopo dos números');
      expect(fixture.nativeElement.querySelector('app-dashboard-hero-chart .scope-soon')).toBeNull();
      const [company, filtered] = Array.from(group.querySelectorAll('button')) as HTMLButtonElement[];
      expect(company.getAttribute('aria-pressed')).toBe('true');
      filtered.click();
      expect(operationFake.setChartScope).toHaveBeenCalledWith('filtered');
    });

    it('those who do not work the queue do not see the scope toggle', async () => {
      asRequester();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.scope-row')).toBeNull();
      expect(fixture.nativeElement.querySelector('.scope-soon')).toBeNull();
    });
  });

  describe('filters', () => {
    it('in the company scope, the bar is hidden, but the URL filters stay visible with "Limpar"', async () => {
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

    it('without filters, no filter row', async () => {
      asAgent();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('.applied-filters')).toBeNull();
    });

    it('without filters in the URL, the Início opens on the whole company, even if the previous visit was left on "Com filtros"', async () => {
      asAgent();
      operationFake.chartScope.set('filtered');
      await render();
      expect(operationFake.setChartScope).toHaveBeenCalledWith('company');
    });

    it('with a department in the URL waiting for the list, the searches stay safe (nothing goes out with the empty selection)', async () => {
      asAgent();
      operationFake.chartScope.set('filtered');
      departmentsFake.departments.set([]);
      departmentsFake.listState.set({ loading: true });
      await TestBed.inject(Router).navigateByUrl('/?departmentId=d1');
      const fixture = await render();
      expect(operationFake.holdScope).toHaveBeenCalled();
      expect(ticketsStoreFake.holdCriticalScope).toHaveBeenCalled();
      expect(operationFake.setScope).not.toHaveBeenCalled();

      // A lista chega: o recorte (os setores do departamento) vale pros números e pros Alertas.
      departmentsFake.departments.set([{ id: 'd1', name: 'TI', description: '', responsibleUserId: null, responsibleUserName: null, activeTicketCount: 0, sectors: [{ id: 's1', name: 'Helpdesk', description: null, activeTicketCount: 0 }, { id: 's2', name: 'Infra', description: null, activeTicketCount: 0 }] }]);
      departmentsFake.listState.set({ loading: false });
      await fixture.whenStable();
      expect(operationFake.setScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
      expect(ticketsStoreFake.setCriticalScope).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
    });

    describe('screen reader announcement', () => {
      /** Texto da região aria-live do cabeçalho, depois do atraso do "limpa e escreve de novo". */
      async function liveAfter(fixture: { whenStable(): Promise<unknown>; nativeElement: HTMLElement }): Promise<string | undefined> {
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 150));
        return (fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement).textContent?.trim();
      }

      describe('automatic vs manual refresh', () => {
        type Fixture = Awaited<ReturnType<typeof render>>;

        /** Cada frase escrita na região aria-live do cabeçalho, na ordem: o que o leitor de tela ouviria. */
        const recordAnnouncements = (fixture: Fixture) => {
          const said: string[] = [];
          const region = fixture.nativeElement.querySelector('.freshness [aria-live="polite"]') as HTMLElement;
          new MutationObserver(() => { const text = region.textContent?.trim(); if (text) said.push(text); })
            .observe(region, { childList: true, characterData: true, subtree: true });
          return said;
        };

        /** Uma atualização inteira: pede (pelo relógio ou pelo botão), carrega, aplica o resultado e espera o anúncio. */
        const cycle = async (fixture: Fixture, origin: 'manual' | 'auto', apply: () => void = () => undefined) => {
          fixture.componentInstance.refresh(origin);
          ticketsStoreFake.statusCountsLoading.set(true);
          await fixture.whenStable();
          apply();
          ticketsStoreFake.statusCountsLoading.set(false);
          await fixture.whenStable();
          await new Promise(resolve => setTimeout(resolve, 150));
        };

        /** Os Alertas falham (falha parcial: os outros blocos têm números). */
        const alertsFail = () => ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
        /** Os Alertas voltam. */
        const alertsBack = () => ticketsStoreFake.criticalTicketsError.set(null);
        /** Todos os blocos sem números (falha total). */
        const everythingFails = () => {
          operationFake.volume.set(null);
          operationFake.overviewError.set('Não foi possível carregar os números da operação.');
          ticketsStoreFake.statusCounts.set(null);
          ticketsStoreFake.statusCountsFailed.set(true);
          ticketsStoreFake.volumeHasValue.set(false);
          ticketsStoreFake.volumeFailed.set(true);
          ticketsStoreFake.criticalTicketsError.set('Erro ao carregar os alertas de SLA');
          operationFake.times.set(null);
        };

        it('with continuous success, the clock announces nothing', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'auto');
          await cycle(fixture, 'auto');

          expect(said).toEqual([]);
          expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Atualizado agora');
        });

        it('a new failure on the clock is announced once; the same failure in the following cycles is not', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'auto', alertsFail);
          await cycle(fixture, 'auto');
          await cycle(fixture, 'auto');

          expect(said).toEqual(['Não foi possível atualizar os números']);
          expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Nem todos os números carregaram');
        });

        it('the recovery via the clock is announced once ("Números de volta"), and the next cycle with no change stays silent', async () => {
          asAgent();
          alertsFail();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'auto', alertsBack);
          await cycle(fixture, 'auto');

          expect(said).toEqual(['Números de volta: atualizado agora']);
          expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Atualizado agora');
        });

        // Parcial → total não acontece numa atualização: o fluxo guarda os últimos pontos bons do mesmo
        // recorte, então há números (velhos) na tela e a falha continua parcial. A troca possível é total → parcial.
        it('the switch from total to partial failure on the clock (one block comes back, another stays in error) is announced once', async () => {
          asAgent();
          everythingFails();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'auto', () => {
            operationFake.volume.set({ totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0, backlogCount: 5 });
            operationFake.overviewError.set(null);
          });
          await cycle(fixture, 'auto');

          expect(said).toEqual(['Não foi possível atualizar os números']);
          expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Nem todos os números carregaram');
        });

        it('with everything down since the first load, the clock does not repeat the total failure; when everything comes back, it announces the recovery once', async () => {
          asAgent();
          everythingFails();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'auto');
          await cycle(fixture, 'auto', () => {
            operationFake.volume.set({ totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0, backlogCount: 5 });
            operationFake.overviewError.set(null);
            ticketsStoreFake.volumeHasValue.set(true);
            ticketsStoreFake.volumeFailed.set(false);
            ticketsStoreFake.criticalTicketsError.set(null);
          });

          expect(said).toEqual(['Números de volta: atualizado agora']);
        });

        it('the button announces every time, including repeated success and the failure that was already in effect', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'manual');
          await cycle(fixture, 'manual');
          await cycle(fixture, 'manual', alertsFail);
          await cycle(fixture, 'manual');

          expect(said).toEqual(['Atualizado agora', 'Atualizado agora', 'Não foi possível atualizar os números', 'Não foi possível atualizar os números']);
        });

        it('clicking the "Atualizar" button counts as a manual request (announces even with no change)', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
          ticketsStoreFake.statusCountsLoading.set(true);
          await fixture.whenStable();
          ticketsStoreFake.statusCountsLoading.set(false);
          await fixture.whenStable();
          await new Promise(resolve => setTimeout(resolve, 150));

          expect(said).toEqual(['Atualizado agora']);
        });

        it('a manual request during an automatic refresh in progress counts as manual: whoever asked hears the result', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          fixture.componentInstance.refresh('auto');
          ticketsStoreFake.statusCountsLoading.set(true);
          await fixture.whenStable();
          fixture.componentInstance.refresh('manual');
          ticketsStoreFake.statusCountsLoading.set(false);
          await fixture.whenStable();
          await new Promise(resolve => setTimeout(resolve, 150));

          expect(said).toEqual(['Atualizado agora']);
        });

        it('the clock firing during a manual request in progress does not take away the announcement from whoever asked', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          fixture.componentInstance.refresh('manual');
          ticketsStoreFake.statusCountsLoading.set(true);
          await fixture.whenStable();
          fixture.componentInstance.refresh('auto');
          ticketsStoreFake.statusCountsLoading.set(false);
          await fixture.whenStable();
          await new Promise(resolve => setTimeout(resolve, 150));

          expect(said).toEqual(['Atualizado agora']);
        });

        it('switching the scope during an automatic refresh says only the summary of the selection', async () => {
          asAgent();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          fixture.componentInstance.refresh('auto');
          operationFake.overviewLoading.set(true);
          await fixture.whenStable();
          const filtered = Array.from(fixture.nativeElement.querySelectorAll('.scope-row button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Com filtros'))!;
          filtered.click();
          operationFake.chartScope.set('filtered');
          operationFake.overviewLoading.set(false);
          await fixture.whenStable();
          await new Promise(resolve => setTimeout(resolve, 150));

          expect(said).toEqual(['Números com os filtros: 2 atrasados, 5 na fila.']);
        });

        it('the 2-minute clock requests the refresh as automatic; the button, as manual', () => {
          asAgent();
          // A aba do Karma pode estar em segundo plano: a visibilidade fica fixa, como no spec dos Alertas.
          spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
          jasmine.clock().install();
          jasmine.clock().mockDate(new Date(2026, 9, 29, 15, 0));
          try {
            const fixture = TestBed.createComponent(DashboardComponent);
            const refresh = spyOn(fixture.componentInstance, 'refresh').and.callThrough();
            fixture.detectChanges();

            jasmine.clock().tick(DASHBOARD_REFRESH_MS - 1);
            expect(refresh).not.toHaveBeenCalled();
            jasmine.clock().tick(1);
            expect(refresh).toHaveBeenCalledOnceWith('auto');

            (fixture.nativeElement.querySelector('button[aria-label="Atualizar os números agora"]') as HTMLButtonElement).click();
            expect(refresh).toHaveBeenCalledWith('manual');
          } finally {
            jasmine.clock().uninstall();
          }
        });

        it('the first load with a failure, followed by the clock with the same failure, announces nothing', async () => {
          asAgent();
          alertsFail();
          const fixture = await render();
          const said = recordAnnouncements(fixture);

          await cycle(fixture, 'auto');

          expect(said).toEqual([]);
        });
      });

      it('the first load announces nothing', async () => {
        asAgent();
        const fixture = await render();
        expect(await liveAfter(fixture)).toBe('');
      });

      it('switching the scope via the buttons announces the summary as soon as nothing is loading, even when the switch starts no search', async () => {
        asAgent();
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

      it('after the summary of a filter change, the next refresh says only "Atualizado agora"', async () => {
        asAgent();
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

    it('changing a filter tells the screen reader a short summary of the new numbers', async () => {
      asAgent();
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

    it('the operational widgets follow the whole company in the company scope (the filters apply only to the lists)', async () => {
      asAgent();
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      await render();
      expect(operationFake.setScope).toHaveBeenCalledWith({});
      expect(ticketsStoreFake.setCriticalScope).toHaveBeenCalledWith({});
    });

    it('with filters in the URL, opens in the "Com filtros" scope, with the bar and the numbers of the selection', async () => {
      asAgent();
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

    it('in "Com filtros" with a period, the KPIs say they count by opening date and the groups below say they follow the filters', async () => {
      asAgent();
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

    it('in "Com filtros", the flow also follows the filters: the points, the footer and the grouping are those of the selection', async () => {
      asAgent();
      operationFake.chartScope.set('filtered');
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).toContain('Chamados com os filtros');
      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).not.toContain('o fluxo ainda é o da empresa toda');
      (fixture.nativeElement.querySelector('button[aria-label="Ver como tabela"]') as HTMLButtonElement).click();
      await fixture.whenStable();
      const rows = Array.from(fixture.nativeElement.querySelectorAll('table tbody tr') as NodeListOf<HTMLElement>);
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('27/10/2026');
      expect(rows[0].querySelector('a')!.getAttribute('href')).toContain('sectorId=s1');

      const week = Array.from(fixture.nativeElement.querySelectorAll('.hero-controls button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.trim() === 'Semana')!;
      week.click();
      expect(operationFake.setGroupBy).toHaveBeenCalledWith('Week');
      expect(ticketsStoreFake.setGroupBy).not.toHaveBeenCalled();
    });

    it('in "Com filtros", a flow error offers "Tentar novamente" on the volume of the selection, not on the company one', async () => {
      asAgent();
      operationFake.chartScope.set('filtered');
      operationFake.trend.set([]);
      operationFake.trendHasValue.set(false);
      operationFake.trendError.set('Não foi possível carregar o volume de chamados.');
      await TestBed.inject(Router).navigateByUrl('/?sectorId=s1');
      const fixture = await render();
      ticketsStoreFake.load.calls.reset();

      (fixture.nativeElement.querySelector('.flow-area [role="alert"] button') as HTMLButtonElement).click();
      expect(operationFake.reloadTrend).toHaveBeenCalled();
      expect(ticketsStoreFake.load).not.toHaveBeenCalled();
    });
  });

  describe('what needs action (those who work the queue)', () => {
    it('overdue and unassigned go to the top and the Central keeps the critical ones', async () => {
      asAgent();
      const fixture = await render();

      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Atrasados 2');
      expect(kpiTexts(fixture.nativeElement)[1]).toContain('Sem responsável 3');
      const central = fixture.nativeElement.querySelector('app-dashboard-metric-group') as HTMLElement;
      expect(central.textContent).toContain('Críticos');
      expect(central.textContent).not.toContain('Ativos, ninguém assumiu');
      expect(central.textContent).not.toContain('Passaram do prazo');
    });

    it('the Alertas de SLA keep only the list (the totals live at the top and in the SLA)', async () => {
      asAgent();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-insights .sla-totals')).toBeNull();
    });

    it('a failed aggregate refresh keeps the numbers, with no alert, and the header warns', async () => {
      asAgent();
      const fixture = await render();

      operationFake.overviewError.set('Não foi possível carregar os números da operação.');
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('app-dashboard-metric-group [role="alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('.freshness-label').textContent).toContain('Falha ao atualizar');
    });

    it('without aggregate numbers, the error appears only once (in the top strip) and reloads the aggregate', async () => {
      asAgent();
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

    it('for those who work the queue, shows the times widget', async () => {
      asAgent();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-times')).not.toBeNull();
    });

    it('shows the Alertas de SLA with the tickets from the store and refreshes only them via the card "Atualizar"', async () => {
      asAgent();
      ticketsStoreFake.criticalTickets.set([{ id: 't1', title: 'Chamado urgente' } as TicketMonitorItem]);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-insights').textContent).toContain('Chamado urgente');
      ticketsStoreFake.load.calls.reset();

      (fixture.nativeElement.querySelector('button[aria-label="Atualizar alertas de SLA"]') as HTMLButtonElement).click();
      expect(ticketsStoreFake.reloadCritical).toHaveBeenCalledTimes(1);
      expect(ticketsStoreFake.load).not.toHaveBeenCalled();
    });

    it('in the DOM (mobile and Tab order), the Alertas de SLA come before the Central; the desktop reorders', async () => {
      asAgent();
      const fixture = await render();
      const alerts = fixture.nativeElement.querySelector('app-dashboard-insights') as HTMLElement;
      const central = fixture.nativeElement.querySelector('app-dashboard-metric-group') as HTMLElement;
      expect(alerts.compareDocumentPosition(central) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(alerts.parentElement!.classList).toContain('order-lg-2');
      expect(central.parentElement!.classList).toContain('order-lg-1');
    });

    it('those who administer without the queue see the company numbers and the Administração shortcuts', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'departments:manage');
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('#quickActionsTitle')).toBeNull();
      const admin = fixture.nativeElement.querySelector('section[aria-labelledby="adminTitle"]') as HTMLElement;
      const links = Array.from(admin.querySelectorAll('a')).map(a => a.getAttribute('href'));
      expect(links).toEqual(['/usuarios', '/departamentos']);
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Total 12');
      expect(fixture.nativeElement.querySelector('.freshness')).not.toBeNull();
    });

    it('the Funções shortcut follows roles:read, the permission of the screen: shown with it, not with only roles:manage', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'roles:read');
      const withRead = await render();
      const links = Array.from(withRead.nativeElement.querySelectorAll('section[aria-labelledby="adminTitle"] a') as NodeListOf<HTMLAnchorElement>)
        .map(a => a.getAttribute('href'));
      expect(links).toEqual(['/usuarios', '/roles']);

      hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'roles:manage');
      const withManageOnly = await render();
      expect(withManageOnly.nativeElement.querySelector('section[aria-labelledby="adminTitle"] a[href="/roles"]')).toBeNull();
    });

    it('with no role at all on the screen (no queue, no own tickets, no administration), it takes up no space', async () => {
      hasPermission.and.returnValue(false);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('#quickActionsTitle')).toBeNull();
      expect(fixture.nativeElement.querySelector('section[aria-labelledby="adminTitle"]')).toBeNull();
    });

    it('does not show Central or Alertas de SLA to those who do not work the queue', async () => {
      asRequester();
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('app-dashboard-insights')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-dashboard-metric-group')).toBeNull();
    });
  });

  describe('those who do not work the queue', () => {
    it('sees the company numbers first and "Seus chamados" after them, without the Ações rápidas card', async () => {
      asRequester();
      const fixture = await render();

      const strip = fixture.nativeElement.querySelector('app-dashboard-kpi-strip') as HTMLElement;
      const mine = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      expect(kpiTexts(fixture.nativeElement)[0]).toContain('Total 12');
      expect(fixture.nativeElement.querySelector('app-dashboard-hero-chart')).not.toBeNull();
      expect(strip.compareDocumentPosition(mine) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Como estão os chamados de toda a empresa.');
      // "Ver todos" já leva a Meus Chamados: sem o card de Ações rápidas repetindo o mesmo atalho.
      expect(fixture.nativeElement.querySelector('#quickActionsTitle')).toBeNull();
    });

    it('on first use (no ticket opened), "Seus chamados" invites the user to open the first one', async () => {
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

    it('the drill-down opens Meus Chamados and says how many of them the person sees', async () => {
      asRequester();
      const fixture = await render();

      const link = kpiLink(fixture.nativeElement, 'Na fila');
      expect(link.getAttribute('href')).toBe('/tickets');
      expect(link.closest('.kpi-card')?.textContent).toContain('Você tem acesso a 3 dos 5 chamados');
      expect(kpiLink(fixture.nativeElement, 'Resolvidos').getAttribute('href')).toBe('/tickets?status=finished');
    });

    it('without tickets:view-own, no number leads to /tickets: the indicators and the composition bar have no link', async () => {
      for (const permissions of [['tickets:create'], ['users:read', 'departments:manage']]) {
        hasPermission.and.callFake((code: string) => permissions.includes(code));
        const fixture = await render();
        const who = permissions.join(', ');

        const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).map(a => a.getAttribute('href') ?? '');
        expect(hrefs.filter(href => href === '/tickets' || href.startsWith('/tickets?'))).withContext(who).toEqual([]);
        expect(fixture.nativeElement.querySelectorAll('.kpi-card a').length).withContext(who).toBe(0);
        expect(fixture.nativeElement.querySelectorAll('.composition-segment a').length).withContext(who).toBe(0);
        // Os números continuam na tela; só não levam a uma lista que a pessoa não pode abrir.
        expect(kpiTexts(fixture.nativeElement)[0]).withContext(who).toContain('Total 12');
      }
    });
  });

  describe('your tickets', () => {
    it('shows the user\'s own tickets in the Meus Chamados groups: each card with the number of the list it opens', async () => {
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

    it('does not show the block to those who work the queue, nor request the summary from the API (the store is not even created)', async () => {
      hasPermission.and.callFake((code: string) => code === 'tickets:view-own' || code === 'tickets:manage');
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]')).toBeNull();
      expect(myTicketsCreated).toBeFalse();
    });

    it('for those who open tickets, the store is created (fetches the summary)', async () => {
      asRequester();
      await render();
      expect(myTicketsCreated).toBeTrue();
    });

    it('on a reload, the numbers stay as they are (no spinner), and the header spins the indicator', async () => {
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

    it('a failed refresh keeps the numbers and the header says "Falha ao atualizar", with no notice in the block', async () => {
      asRequester();
      myTicketsFake.stale.set(true);
      const fixture = await render();

      const section = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"]') as HTMLElement;
      expect(section.querySelector('[role="alert"]')).toBeNull();
      expect(section.textContent).toContain('2 abertos, 1 em andamento');
      expect((fixture.nativeElement.querySelector('.freshness-label') as HTMLElement).textContent).toContain('Falha ao atualizar');
    });

    it('failure: neutral notice with "Tentar novamente"', async () => {
      asRequester();
      myTicketsFake.failed.set(true);
      const fixture = await render();

      const retry = fixture.nativeElement.querySelector('section[aria-labelledby="myTicketsTitle"] [role="alert"] button') as HTMLButtonElement;
      retry.click();
      expect(myTicketsFake.reload).toHaveBeenCalled();
    });
  });

  describe('Ações rápidas', () => {
    it('shows Novo Chamado, Meus Chamados and Atribuídos a mim to whoever works the queue with tickets:create and tickets:view-own', async () => {
      asAgent();
      const fixture = await render();
      const links = Array.from(fixture.nativeElement.querySelectorAll('.quick-link') as NodeListOf<HTMLElement>).map(a => a.textContent ?? '');
      expect(links.some(t => t.includes('Meus Chamados'))).toBeTrue();
      expect(links.some(t => t.includes('Atribuídos a mim'))).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Novo Chamado');
    });

    it('does not show the "Novo Chamado" and "Meus Chamados" shortcuts without tickets:create and tickets:view-own', async () => {
      hasPermission.and.callFake((code: string) => code === 'tickets:manage');
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('a[href="/tickets/novo"]')).toBeNull();
      const links = Array.from(fixture.nativeElement.querySelectorAll('.quick-link') as NodeListOf<HTMLElement>).map(a => a.textContent ?? '');
      expect(links.some(t => t.includes('Meus Chamados'))).toBeFalse();
    });

    it('does not show "Atribuídos a mim" to those who do not work the queue', async () => {
      const fixture = await render();
      expect(fixture.nativeElement.textContent).not.toContain('Atribuídos a mim');
    });

    it('the seed Administrador (every permission) sees "Novo Chamado" in the header and "Meus Chamados" with "Atribuídos a mim" in the Ações rápidas: the shortcuts follow the permissions, not a deduced profile', async () => {
      hasPermission.and.returnValue(true);
      const fixture = await render();

      const newTicket = fixture.nativeElement.querySelector('app-page-header a[href="/tickets/novo"]') as HTMLAnchorElement | null;
      expect(newTicket?.textContent).toContain('Novo Chamado');
      const links = Array.from(fixture.nativeElement.querySelectorAll('.quick-link') as NodeListOf<HTMLAnchorElement>);
      expect(links.find(a => a.textContent?.includes('Meus Chamados'))?.getAttribute('href')).toBe('/tickets');
      expect(links.some(a => a.textContent?.includes('Atribuídos a mim'))).toBeTrue();
    });

    it('an administrative user who works the queue without tickets:create and tickets:view-own sees only "Atribuídos a mim"', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read' || code === 'tickets:manage');
      const fixture = await render();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Atribuídos a mim');
      expect(text).not.toContain('Novo Chamado');
      expect(text).not.toContain('Meus Chamados');
    });

    it('an administrative user without tickets:manage sees neither the empty card nor the shortcut to Monitorar', async () => {
      hasPermission.and.callFake((code: string) => code === 'users:read');
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('a[href^="/tickets/monitorar"]')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Ações rápidas');
    });

    it('Novo Chamado is a real link (<a>), so it works with Ctrl+click/new tab', async () => {
      asRequester();
      const fixture = await render();
      const link = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).find(a => a.textContent?.includes('Novo Chamado'));
      expect(link).toBeTruthy();
    });
  });

  it('uses a heading hierarchy without jumps: h1 on the greeting, h2 on the blocks and h3 only inside a block', async () => {
    asAgent();
    const fixture = await render();
    const levels = Array.from(fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>).map(h => Number(h.tagName[1]));
    expect(levels[0]).toBe(1);
    expect(levels).toContain(3);
    expect(levels.slice(1).every((level, i) => level >= 2 && level <= levels[i] + 1)).toBeTrue();
  });

  describe('"Atribuir" in the Alertas de SLA', () => {
    const unassigned = {
      id: 't7', title: 'VPN caindo', sectorName: 'Infra', assignedToUserId: null, assignedToName: null,
      dueAtUtc: new Date(Date.now() + 3_600_000).toISOString(), slaStatus: 2
    } as unknown as TicketMonitorItem;

    /** Abre o Início como quem atende a fila e atribui a outras pessoas, com um alerta sem responsável, e clica em "Atribuir". */
    async function openAssignDialog() {
      hasPermission.and.callFake((code: string) => code === 'tickets:manage' || code === 'tickets:assign');
      ticketsStoreFake.criticalTickets.set([unassigned]);
      const fixture = await render();
      (fixture.nativeElement.querySelector('button[aria-label="Atribuir responsável ao chamado VPN caindo"]') as HTMLButtonElement).click();
      await fixture.whenStable();
      return fixture;
    }

    it('does not show "Atribuir" to those who work the queue without tickets:assign', async () => {
      asAgent();
      ticketsStoreFake.criticalTickets.set([unassigned]);
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('button[aria-label="Atribuir responsável ao chamado VPN caindo"]')).toBeNull();
    });

    it('the seed Atendente, without tickets:assign, sees "Atribuir a mim" and takes the ticket for themselves', async () => {
      asAgent();
      ticketsStoreFake.criticalTickets.set([unassigned]);
      const fixture = await render();

      (fixture.nativeElement.querySelector('button[aria-label="Atribuir a mim o chamado VPN caindo"]') as HTMLButtonElement).click();
      expect(ticketsStoreFake.assignResponsible).toHaveBeenCalledWith('t7', 'u-me', jasmine.any(Function));
      expect(fixture.nativeElement.querySelector('app-ticket-assign-dialog')).toBeNull();

      ticketsStoreFake.assignResponsible.calls.mostRecent().args[2]();
      expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado atribuído a você.');
    });

    it('shows the failure of "Atribuir a mim" in the Alertas, and not the one of the dialog', async () => {
      asAgent();
      ticketsStoreFake.criticalTickets.set([unassigned]);
      ticketsStoreFake.assignError.set('Você não tem permissão para atribuir o responsável deste chamado.');
      const fixture = await render();

      expect(fixture.nativeElement.querySelector('app-dashboard-insights [role="alert"]')?.textContent)
        .toContain('Você não tem permissão para atribuir o responsável deste chamado.');
    });

    it('opens the assignment dialog with the search cleared', async () => {
      const fixture = await openAssignDialog();
      expect(ticketsStoreFake.resetAssignment).toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('app-ticket-assign-dialog')).not.toBeNull();
    });

    it('on confirm, assigns via the store and, on success, notifies and closes the dialog', async () => {
      const fixture = await openAssignDialog();
      const dialog = fixture.debugElement.query(debug => debug.name === 'app-ticket-assign-dialog');

      dialog.componentInstance.confirm.emit({ userId: 'u9', name: 'Ana Lima' });
      expect(ticketsStoreFake.assignResponsible).toHaveBeenCalledWith('t7', 'u9', jasmine.any(Function));

      ticketsStoreFake.assignResponsible.calls.mostRecent().args[2]();
      await fixture.whenStable();
      expect(toastServiceFake.show).toHaveBeenCalledWith('Ana Lima agora é o responsável.');
      expect(fixture.nativeElement.querySelector('app-ticket-assign-dialog')).toBeNull();
    });

    it('closing without assigning clears the search and does not call the store', async () => {
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

  it('computes the comparison and the SLA rate without making up a number', () => {
    expect(countTrend(12, 10)).toBe('2 a mais que no período anterior');
    expect(countTrend(8, 10)).toBe('2 a menos que no período anterior');
    expect(countTrend(10, 10)).toBe('igual ao período anterior');
    expect(countTrend(10, undefined)).toBeNull();
    expect(slaRate(7, 1)).toBe(88);
    expect(slaRate(0, 0)).toBeNull();
  });
});
