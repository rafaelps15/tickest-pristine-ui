import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketDashboardStore } from './ticket-dashboard.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDashboardOverview } from '../entities/ticket-dashboard';
import { TicketAverageTimes } from '../entities/ticket-average-times';
import { TicketPriority } from '../entities/ticket-priority';
import { SessionService } from '../../shared';

/** Agregado de exemplo, com um número diferente em cada campo. */
const OVERVIEW: TicketDashboardOverview = {
  serverNowUtc: '2026-10-28T15:00:00Z',
  volume: { total: 20, open: 3, inProgress: 2, resolved: 6, closed: 1, canceled: 8, backlog: 5 },
  sla: { onTime: 4, atRisk: 1, breached: 2, met: 7, missed: 9, notApplicable: 0 },
  attention: { overdue: 2, critical: 4, unassigned: 3 }
};

/** Tempos de exemplo: primeira resposta calculada, resolução abaixo da amostra mínima. */
const TIMES: TicketAverageTimes = {
  firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
  resolution: { averageMinutes: null, medianMinutes: null, sampleSize: 4 },
  minimumSample: 5
};

describe('TicketDashboardStore', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;
  let permissions: Set<string>;

  /** Cria o Store com o Data Service falso e as permissões do teste. */
  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId: signal('u-me'), hasPermission: (code: string) => permissions.has(code) } }
      ]
    });
    return TestBed.inject(TicketDashboardStore);
  }

  /** Espera os resources resolverem. */
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getOverview', 'getTimes', 'getVolume']);
    dataService.getOverview.and.returnValue(of(OVERVIEW));
    dataService.getTimes.and.returnValue(of(TIMES));
    dataService.getVolume.and.returnValue(of([{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]));
    permissions = new Set(['tickets:manage']);
  });

  it('expõe Volume, SLA e Central de atenção do agregado do servidor, numa chamada só', async () => {
    const store = createStore();
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledTimes(1);
    expect(store.volume()).toEqual(OVERVIEW.volume);
    expect(store.sla()).toEqual(OVERVIEW.sla);
    expect(store.attention()).toEqual(OVERVIEW.attention);
  });

  it('expõe os tempos médios e o gráfico do recorte', async () => {
    const store = createStore();
    await settle();

    expect(store.times()).toEqual(TIMES);
    expect(store.trend()).toEqual([{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]);
    expect(dataService.getVolume).toHaveBeenCalledWith('Day', jasmine.objectContaining({ sectorIds: undefined }));
  });

  it('aplica o período à abertura no agregado e no gráfico, e à conclusão nos tempos', async () => {
    const store = createStore();
    store.setScope({ sectorIds: ['s1', 's2'], priority: TicketPriority.High, from: '2026-10-01', to: '2026-10-28' });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({
      sectorIds: ['s1', 's2'], priority: TicketPriority.High, createdFrom: '2026-10-01', createdTo: '2026-10-28'
    }));
    expect(dataService.getTimes).toHaveBeenCalledWith(jasmine.objectContaining({ resolvedFrom: '2026-10-01', resolvedTo: '2026-10-28' }));
    expect(dataService.getVolume).toHaveBeenCalledWith('Day', jasmine.objectContaining({ createdFrom: '2026-10-01', createdTo: '2026-10-28' }));
  });

  it('"meus" vira o id de quem está logado, "sem responsável" vira unassignedOnly, e uma pessoa vai pelo id', async () => {
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

  it('recorte igual não refaz as requisições', async () => {
    const store = createStore();
    store.setScope({ sectorIds: ['s1'] });
    await settle();
    const calls = dataService.getOverview.calls.count();

    store.setScope({ sectorIds: ['s1'] });
    await settle();

    expect(dataService.getOverview.calls.count()).toBe(calls);
  });

  it('trocar o agrupamento refaz só o gráfico', async () => {
    const store = createStore();
    await settle();
    const overviewCalls = dataService.getOverview.calls.count();

    store.setGroupBy('Month');
    await settle();

    expect(dataService.getVolume).toHaveBeenCalledWith('Month', jasmine.anything());
    expect(dataService.getOverview.calls.count()).toBe(overviewCalls);
  });

  it('sem tickets:manage não pergunta nada à API', async () => {
    permissions = new Set();
    const store = createStore();
    await settle();

    expect(dataService.getOverview).not.toHaveBeenCalled();
    expect(dataService.getTimes).not.toHaveBeenCalled();
    expect(dataService.getVolume).not.toHaveBeenCalled();
    expect(store.volume()).toBeNull();
  });

  it('um widget falhar não derruba os outros, e o "Tentar novamente" recupera', async () => {
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

  it('erro nos tempos e no gráfico aparece em cada um', async () => {
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
