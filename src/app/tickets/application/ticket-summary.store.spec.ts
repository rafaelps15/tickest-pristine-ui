import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketSummaryStore } from './ticket-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatusCounts } from '../entities/ticket-status-counts';

describe('TicketSummaryStore', () => {
  let store: InstanceType<typeof TicketSummaryStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  const statusCounts: TicketStatusCounts = {
    totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0
  };

  /** Injeta o store (disparando a busca inicial com o retorno já configurado no spy) e espera estabilizar. */
  async function createStore(): Promise<InstanceType<typeof TicketSummaryStore>> {
    const created = TestBed.inject(TicketSummaryStore);
    await TestBed.inject(ApplicationRef).whenStable();
    return created;
  }

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getStatusCounts', 'getVolume']);
    dataService.getStatusCounts.and.returnValue(of(statusCounts));
    dataService.getVolume.and.returnValue(of([
      { periodStart: '2026-01-05', count: 2 },
      { periodStart: '2026-01-06', count: 5 }
    ]));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketSummaryStore,
        { provide: TicketDataService, useValue: dataService }
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

    expect(store.state().error).toBe('Erro ao carregar o resumo dos tickets');
    expect(store.state().loading).toBeFalse();
  });

  it('expõe mensagem de erro quando a busca do volume falhar', async () => {
    dataService.getVolume.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao carregar o volume de tickets');
    expect(store.state().loading).toBeFalse();
  });
});
