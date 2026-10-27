import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketSummaryStore } from './ticket-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatusCounts } from '../entities/ticket-status-counts';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService } from '../../shared';

describe('TicketSummaryStore', () => {
  let store: InstanceType<typeof TicketSummaryStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let sessionService: jasmine.SpyObj<SessionService>;

  const statusCounts: TicketStatusCounts = {
    totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0
  };

  const criticalTicket: TicketMonitorItem = {
    id: 't1', title: 'Chamado urgente', priority: TicketPriority.High, status: TicketStatus.InProgress,
    requesterId: 'r1', requesterName: 'Fulano', requesterEmail: 'fulano@empresa.com',
    assignedToUserId: 'u1', assignedToName: 'Atendente', sectorId: 's1', sectorName: 'TI',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.AtRisk
  };

  /** Injeta o store (disparando a busca inicial com o retorno já configurado no spy) e espera estabilizar. */
  async function createStore(): Promise<InstanceType<typeof TicketSummaryStore>> {
    const created = TestBed.inject(TicketSummaryStore);
    await TestBed.inject(ApplicationRef).whenStable();
    return created;
  }

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getStatusCounts', 'getVolume', 'getAll']);
    dataService.getStatusCounts.and.returnValue(of(statusCounts));
    dataService.getVolume.and.returnValue(of([
      { periodStart: '2026-01-05', count: 2 },
      { periodStart: '2026-01-06', count: 5 }
    ]));
    dataService.getAll.and.returnValue(of({
      items: [criticalTicket], page: 1, pageSize: 5, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false
    }));

    sessionService = jasmine.createSpyObj('SessionService', ['hasPermission']);
    sessionService.hasPermission.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketSummaryStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: sessionService }
      ]
    });
    store = await createStore();
  });

  it('busca os totais por status e o volume (agrupado por dia, por padrão) de toda a empresa', () => {
    expect(dataService.getStatusCounts).toHaveBeenCalled();
    expect(dataService.getVolume).toHaveBeenCalledWith('Day');
  });

  it('expõe os totais dos cards a partir dos totais por status', () => {
    expect(store.total()).toBe(10);
    expect(store.openCount()).toBe(3);
    expect(store.inProgressCount()).toBe(2);
    expect(store.resolvedCount()).toBe(4);
    expect(store.closedCount()).toBe(1);
    expect(store.canceledCount()).toBe(0);
  });

  it('expõe os pontos de volume retornados pela API', () => {
    expect(store.volume()).toEqual([
      { periodStart: '2026-01-05', count: 2 },
      { periodStart: '2026-01-06', count: 5 }
    ]);
  });

  it('refaz a busca do volume com o novo agrupamento ao mudar o período', async () => {
    store.setGroupBy('Month');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getVolume).toHaveBeenCalledWith('Month');
  });

  it('expõe mensagem de erro quando a busca dos totais por status falhar', async () => {
    dataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.summaryError()).toBe('Erro ao carregar o resumo dos tickets');
    expect(store.statusCountsFailed()).toBeTrue();
    expect(store.volumeFailed()).toBeFalse();
  });

  it('não marca nenhuma busca como falha quando as duas respondem', () => {
    expect(store.statusCountsFailed()).toBeFalse();
    expect(store.volumeFailed()).toBeFalse();
  });

  it('expõe mensagem de erro quando a busca do volume falhar', async () => {
    dataService.getVolume.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.summaryError()).toBe('Erro ao carregar o volume de tickets');
    expect(store.volumeFailed()).toBeTrue();
    expect(store.statusCountsFailed()).toBeFalse();
  });

  it('busca os chamados com SLA em risco, ordenados por prazo, para quem tem tickets:manage', () => {
    expect(dataService.getAll).toHaveBeenCalledWith({
      slaStatus: TicketSlaStatus.AtRisk, sort: TicketSortOrder.DueDate, page: 1, pageSize: 5
    });
    expect(store.criticalTickets()).toEqual([criticalTicket]);
  });

  it('refaz a busca dos chamados em risco de SLA ao chamar load()', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledTimes(2);
  });

  it('expõe mensagem de erro quando a busca dos chamados em risco de SLA falhar', async () => {
    dataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.criticalTicketsError()).toBe('Erro ao carregar os alertas de SLA');
    expect(store.criticalTicketsLoading()).toBeFalse();
  });

  describe('sem a permissão tickets:manage', () => {
    beforeEach(async () => {
      sessionService.hasPermission.and.returnValue(false);
      dataService.getAll.calls.reset();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          TicketSummaryStore,
          { provide: TicketDataService, useValue: dataService },
          { provide: SessionService, useValue: sessionService }
        ]
      });
      store = await createStore();
    });

    it('não busca os chamados em risco de SLA, e a lista fica vazia', () => {
      expect(dataService.getAll).not.toHaveBeenCalled();
      expect(store.criticalTickets()).toEqual([]);
    });
  });
});
