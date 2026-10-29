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
   * Cria o Store com o Data Service falso, as permissões e as flags do teste. Por padrão, com o
   * back-end pronto (flags ligadas) e o gráfico no escopo do recorte, pra exercitar todas as leituras.
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
    features = { operationOverview: true, averageTimes: true, volumeResolved: true, companyStatsForAll: false, listPeriodFilter: false };
  });

  describe('flags do back-end (DASHBOARD_FEATURES)', () => {
    it('com as flags desligadas, não faz nenhuma requisição e nada fica carregando', async () => {
      features = { operationOverview: false, averageTimes: false, volumeResolved: false, companyStatsForAll: false, listPeriodFilter: false };
      const store = createStore();
      store.setScope({ from: '2026-10-01', to: '2026-10-28' });
      await settle();

      expect(dataService.getOverview).not.toHaveBeenCalled();
      expect(dataService.getTimes).not.toHaveBeenCalled();
      expect(dataService.getVolume).not.toHaveBeenCalled();
      expect(store.overviewLoading()).toBeFalse();
      expect(store.overviewError()).toBeNull();
    });

    it('cada flag libera só a sua leitura', async () => {
      features = { operationOverview: false, averageTimes: true, volumeResolved: false, companyStatsForAll: false, listPeriodFilter: false };
      createStore();
      await settle();

      expect(dataService.getOverview).not.toHaveBeenCalled();
      expect(dataService.getTimes).toHaveBeenCalledTimes(1);
      expect(dataService.getVolume).not.toHaveBeenCalled();
    });

    it('com a flag ligada, um 404 é erro de verdade (não "em breve")', async () => {
      dataService.getOverview.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      const store = createStore();
      await settle();

      expect(store.overviewError()).toBeTruthy();
    });
  });

  it('o volume do recorte só é pedido no escopo "Com filtros"', async () => {
    const store = createStore('company');
    await settle();
    expect(dataService.getVolume).not.toHaveBeenCalled();

    store.setChartScope('filtered');
    await settle();
    expect(dataService.getVolume).toHaveBeenCalledTimes(1);
    expect(store.trendHasValue()).toBeTrue();
  });

  it('refresh recarrega as leituras ligadas mantendo os números na tela', async () => {
    const store = createStore();
    await settle();
    dataService.getOverview.calls.reset();

    store.refresh();
    expect(store.volume()).toEqual(OVERVIEW.volume);
    await settle();

    expect(dataService.getOverview).toHaveBeenCalled();
    expect(store.volume()).toEqual(OVERVIEW.volume);
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

  it('com período fechado, busca também o período anterior de mesmo tamanho pra comparar', async () => {
    const store = createStore();
    store.setScope({ sectorIds: ['s1'], from: '2026-10-22', to: '2026-10-28' });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1'], createdFrom: '2026-10-15', createdTo: '2026-10-21' }));
    expect(store.previousOverview()).toEqual(OVERVIEW);
  });

  it('sem período (ou com uma ponta só), não há período anterior', async () => {
    const store = createStore();
    store.setScope({ from: '2026-10-01' });
    await settle();

    expect(dataService.getOverview).toHaveBeenCalledTimes(1);
    expect(store.previousOverview()).toBeNull();
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

  it('com o recorte seguro (departamento esperando a lista), nada é pedido; o setScope solta já com o recorte certo', async () => {
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

  it('num período de mais de 366 dias, dia a dia não cabe: o gráfico pede por semana e "Dia" fica indisponível', async () => {
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

  it('uma atualização do agregado que falha mantém os números do recorte (velhos), e trocar o recorte os zera', async () => {
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

  it('uma atualização dos tempos que falha mantém os tempos anteriores do recorte', async () => {
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
