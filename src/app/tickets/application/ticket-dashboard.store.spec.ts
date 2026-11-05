import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketDashboardStore } from './ticket-dashboard.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDashboardOverview } from '../entities/ticket-dashboard';
import { TicketAverageTimes } from '../entities/ticket-average-times';
import { TicketPriority } from '../entities/ticket-priority';
import { DASHBOARD_FEATURES, DashboardFeatures, SessionService } from '../../shared';

/** Agregado de exemplo, com um número diferente em cada campo. */
const OVERVIEW: TicketDashboardOverview = {
  serverNowUtc: '2026-10-28T15:00:00Z',
  volume: { totalCount: 20, openCount: 3, inProgressCount: 2, resolvedCount: 6, closedCount: 1, canceledCount: 8, backlogCount: 5 },
  sla: { onTimeCount: 4, atRiskCount: 1, breachedCount: 2, metCount: 7, missedCount: 9, notApplicableCount: 0 },
  attention: { breachedCount: 2, criticalCount: 4, unassignedCount: 3 }
};

/** Tempos de exemplo: primeira resposta calculada, resolução abaixo da amostra mínima. */
const TIMES: TicketAverageTimes = {
  firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
  resolution: { averageMinutes: null, medianMinutes: null, sampleSize: 4 },
  minimumSampleSize: 5
};

describe('TicketDashboardStore', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;
  let permissions: Set<string>;
  let features: DashboardFeatures;

  /**
   * Cria o Store com o Data Service falso, as permissões e a flag do teste. Por padrão, com o volume
   * do recorte ligado e o gráfico no escopo do recorte, pra exercitar todas as leituras.
   */
  function createStore(chartScope: 'company' | 'filtered' = 'filtered') {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId: signal('u-me'), hasPermission: (code: string) => permissions.has(code) } },
        { provide: DASHBOARD_FEATURES, useValue: features }
      ]
    });
    const store = TestBed.inject(TicketDashboardStore);
    store.setChartScope(chartScope);
    return store;
  }

  /** Espera os resources resolverem. */
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getOverview', 'getTimes', 'getVolume']);
    dataService.getOverview.and.returnValue(of(OVERVIEW));
    dataService.getTimes.and.returnValue(of(TIMES));
    dataService.getVolume.and.returnValue(of([{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]));
    permissions = new Set(['tickets:manage']);
    features = { volumeResolved: true };
  });

  describe('volumeResolved flag (DASHBOARD_FEATURES)', () => {
    it('off, does not request the volume of the slice, even in "Com filtros"; the overview and the times do not depend on a flag', async () => {
      features = { volumeResolved: false };
      createStore('filtered');
      await settle();

      expect(dataService.getOverview).toHaveBeenCalledTimes(1);
      expect(dataService.getTimes).toHaveBeenCalledTimes(1);
      expect(dataService.getVolume).not.toHaveBeenCalled();
    });

    it('a 404 in the overview is a real error (not "em breve")', async () => {
      dataService.getOverview.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      const store = createStore();
      await settle();

      expect(store.overviewError()).toBeTruthy();
    });
  });

  it('the volume of the slice is only requested in the "Com filtros" scope', async () => {
    const store = createStore('company');
    await settle();
    expect(dataService.getVolume).not.toHaveBeenCalled();

    store.setChartScope('filtered');
    await settle();
    expect(dataService.getVolume).toHaveBeenCalledTimes(1);
    expect(store.trendHasValue()).toBeTrue();
  });

  it('refresh reloads the enabled reads keeping the numbers on screen', async () => {
    const store = createStore();
    await settle();
    dataService.getOverview.calls.reset();

    store.refresh();
    expect(store.volume()).toEqual(OVERVIEW.volume);
    await settle();

    expect(dataService.getOverview).toHaveBeenCalled();
    expect(store.volume()).toEqual(OVERVIEW.volume);
  });

  it('exposes Volume, SLA and Central de atenção from the server aggregate, in a single call', async () => {
    const store = createStore();
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledTimes(1);
    expect(store.volume()).toEqual(OVERVIEW.volume);
    expect(store.sla()).toEqual(OVERVIEW.sla);
    expect(store.attention()).toEqual(OVERVIEW.attention);
  });

  it('exposes the average times and the chart of the slice', async () => {
    const store = createStore();
    await settle();

    expect(store.times()).toEqual(TIMES);
    expect(store.trend()).toEqual([{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]);
    expect(dataService.getVolume).toHaveBeenCalledWith('Day', jasmine.objectContaining({ sectorIds: undefined }));
  });

  it('applies the period to the opening in the aggregate and the chart, and to the completion in the times', async () => {
    const store = createStore();
    store.setScope({ sectorIds: ['s1', 's2'], priority: TicketPriority.High, from: '2026-10-01', to: '2026-10-28' });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({
      sectorIds: ['s1', 's2'], priority: TicketPriority.High, createdFrom: '2026-10-01', createdTo: '2026-10-28'
    }));
    expect(dataService.getTimes).toHaveBeenCalledWith(jasmine.objectContaining({ resolvedFrom: '2026-10-01', resolvedTo: '2026-10-28' }));
    expect(dataService.getVolume).toHaveBeenCalledWith('Day', jasmine.objectContaining({ createdFrom: '2026-10-01', createdTo: '2026-10-28' }));
  });

  it('with a closed period, also fetches the previous period of the same length for comparison', async () => {
    const store = createStore();
    store.setScope({ sectorIds: ['s1'], from: '2026-10-22', to: '2026-10-28' });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1'], createdFrom: '2026-10-15', createdTo: '2026-10-21' }));
    expect(store.previousOverview()).toEqual(OVERVIEW);
  });

  it('without a period (or with only one end), there is no previous period', async () => {
    const store = createStore();
    store.setScope({ from: '2026-10-01' });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledTimes(1);
    expect(store.previousOverview()).toBeNull();
  });

  it('"meus" becomes the logged-in user id, "sem responsável" becomes unassignedOnly, and a person goes by id', async () => {
    const store = createStore();
    store.setScope({ assignee: 'me' });
    await settle();
    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({ assignedToUserId: 'u-me' }));

    store.setScope({ assignee: 'none' });
    await settle();
    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({ unassignedOnly: true }));

    store.setScope({ assignedToUserId: 'u-ana' });
    await settle();
    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({ assignedToUserId: 'u-ana' }));
  });

  it('with the slice not safe (department waiting for the list), nothing is requested; setScope releases it already with the right slice', async () => {
    const store = createStore();
    store.holdScope();
    await settle();

    expect(dataService.getOverview).not.toHaveBeenCalled();
    expect(dataService.getTimes).not.toHaveBeenCalled();
    expect(dataService.getVolume).not.toHaveBeenCalled();
    expect(store.overviewLoading()).toBeFalse();

    store.setScope({ sectorIds: ['s1', 's2'] });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledTimes(1);
    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
    expect(dataService.getTimes).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
  });

  it('an identical slice does not redo the requests', async () => {
    const store = createStore();
    store.setScope({ sectorIds: ['s1'] });
    await settle();
    const calls = dataService.getOverview.calls.count();

    store.setScope({ sectorIds: ['s1'] });
    await settle();

    expect(dataService.getOverview.calls.count()).toBe(calls);
  });

  it('changing the grouping redoes only the chart', async () => {
    const store = createStore();
    await settle();
    const overviewCalls = dataService.getOverview.calls.count();

    store.setGroupBy('Month');
    await settle();

    expect(dataService.getVolume).toHaveBeenCalledWith('Month', jasmine.anything());
    expect(dataService.getOverview.calls.count()).toBe(overviewCalls);
  });

  it('in a period of more than 366 days, day by day does not fit: the chart asks by week and "Dia" becomes unavailable', async () => {
    const store = createStore();
    store.setScope({ from: '2025-01-01', to: '2026-10-27' });
    await settle();

    expect(store.trendGroupBy()).toBe('Week');
    expect(store.unavailableGroupings()).toEqual(['Day']);
    expect(dataService.getVolume).toHaveBeenCalledWith('Week', jasmine.objectContaining({ createdFrom: '2025-01-01', createdTo: '2026-10-27' }));

    store.setScope({ from: '2026-10-01', to: '2026-10-27' });
    await settle();
    expect(store.trendGroupBy()).toBe('Day');
    expect(store.unavailableGroupings()).toEqual([]);
  });

  it('without an end in the period, counts until today in Brasília time: at 23:30 on 31/10, 366 days still fit day by day', async () => {
    // 02:30 UTC de 01/11 é 23:30 de 31/10 em Brasília; com a data UTC, o período teria 367 dias e "Dia" sumiria.
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-11-01T02:30:00Z'));
    try {
      const store = createStore();
      store.setScope({ from: '2025-10-31' });

      expect(store.unavailableGroupings()).toEqual([]);
      expect(store.trendGroupBy()).toBe('Day');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('without tickets:manage it asks the API nothing', async () => {
    permissions = new Set();
    const store = createStore();
    await settle();

    expect(dataService.getOverview).not.toHaveBeenCalled();
    expect(dataService.getTimes).not.toHaveBeenCalled();
    expect(dataService.getVolume).not.toHaveBeenCalled();
    expect(store.volume()).toBeNull();
  });

  it('one widget failing does not take down the others, and "Tentar novamente" recovers it', async () => {
    dataService.getOverview.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const store = createStore();
    await settle();

    expect(store.overviewError()).toBeTruthy();
    expect(store.volume()).toBeNull();
    expect(store.times()).toEqual(TIMES);
    expect(store.timesError()).toBeNull();

    dataService.getOverview.and.returnValue(of(OVERVIEW));
    store.reloadOverview();
    await settle();

    expect(store.overviewError()).toBeNull();
    expect(store.volume()).toEqual(OVERVIEW.volume);
  });

  it('a failed aggregate refresh keeps the (old) numbers of the slice, and changing the slice zeroes them', async () => {
    const store = createStore();
    await settle();
    // A tela lê o agregado o tempo todo; é essa leitura que guarda os últimos números bons.
    expect(store.overview()).toEqual(OVERVIEW);

    dataService.getOverview.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.reloadOverview();
    await settle();

    expect(store.overviewError()).toBeTruthy();
    expect(store.attention()).toEqual(OVERVIEW.attention);
    expect(store.overviewStale()).toBeTrue();
    expect(store.overviewFailed()).toBeFalse();

    store.setScope({ priority: TicketPriority.Urgent });
    await settle();

    expect(store.overview()).toBeNull();
    expect(store.overviewFailed()).toBeTrue();
  });

  it('a failed refresh of the times keeps the previous times of the slice', async () => {
    const store = createStore();
    await settle();
    // A tela lê os tempos o tempo todo; é essa leitura que guarda os últimos bons.
    expect(store.times()).toEqual(TIMES);

    dataService.getTimes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.reloadTimes();
    await settle();

    expect(store.timesError()).toBeTruthy();
    expect(store.times()).toEqual(TIMES);
    expect(store.timesStale()).toBeTrue();
    expect(store.timesFailed()).toBeFalse();
  });

  it('an error in the times and in the chart shows up in each one', async () => {
    dataService.getTimes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    dataService.getVolume.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = createStore();
    await settle();

    expect(store.timesError()).toBeTruthy();
    expect(store.trendError()).toBeTruthy();
    expect(store.trend()).toEqual([]);
    expect(store.overviewError()).toBeNull();
  });
});
