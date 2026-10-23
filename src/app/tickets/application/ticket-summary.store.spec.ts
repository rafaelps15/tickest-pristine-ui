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

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketSummaryStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = await createStore();
  });

  it('busca os totais por status de toda a empresa, sem buscar o volume (sem consumidor hoje)', () => {
    expect(dataService.getStatusCounts).toHaveBeenCalled();
    expect(dataService.getVolume).not.toHaveBeenCalled();
  });

  it('expõe os totais dos cards a partir dos totais por status', () => {
    expect(store.total()).toBe(10);
    expect(store.openCount()).toBe(3);
    expect(store.inProgressCount()).toBe(2);
    expect(store.resolvedCount()).toBe(4);
  });

  it('expõe mensagem de erro quando a busca dos totais por status falhar', async () => {
    dataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao carregar o resumo dos tickets');
    expect(store.state().loading).toBeFalse();
  });
});
