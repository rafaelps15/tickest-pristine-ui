import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketHistoryStore } from './ticket-history.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketHistoryAction, TicketHistoryEntry } from '../entities/ticket-history';
import { CursorPage } from '../../shared';

describe('TicketHistoryStore', () => {
  const entry: TicketHistoryEntry = {
    id: 'h1', ticketId: 't1', changedByUserId: 'u1',
    action: TicketHistoryAction.Created, description: 'Chamado criado',
    oldValue: null, newValue: null, occurredAtUtc: '2026-01-01T12:00:00Z'
  };

  /** Monta uma página por cursor com os eventos informados; o cursor aponta para o último. */
  function pageOf(items: TicketHistoryEntry[], hasNextPage = false): CursorPage<TicketHistoryEntry> {
    const last = items[items.length - 1];
    return { items, nextCursorDate: last?.occurredAtUtc ?? null, nextCursorId: last?.id ?? null, hasNextPage };
  }

  let store: InstanceType<typeof TicketHistoryStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById', 'removeAssignee', 'getHistory']);
    dataService.getHistory.and.returnValue(of(pageOf([entry])));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketHistoryStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketHistoryStore);
  });

  it('não chama a API antes de um chamado ser definido', () => {
    expect(dataService.getHistory).not.toHaveBeenCalled();
  });

  it('carrega o histórico do chamado informado', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getHistory).toHaveBeenCalledWith('t1');
    expect(store.entries()).toEqual([entry]);
  });

  it('carrega a próxima página pelo cursor e acrescenta os eventos aos já exibidos', async () => {
    const older: TicketHistoryEntry = { ...entry, id: 'h0', description: 'Responsável removido', occurredAtUtc: '2025-12-01T12:00:00Z' };
    dataService.getHistory.and.returnValues(of(pageOf([entry], true)), of(pageOf([older])));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.hasMore()).toBeTrue();

    store.loadMore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getHistory).toHaveBeenCalledWith('t1', { cursorDate: entry.occurredAtUtc, cursorId: 'h1' });
    expect(store.entries()).toEqual([entry, older]);
    expect(store.hasMore()).toBeFalse();
    expect(store.loadingMore()).toBeFalse();
  });

  it('não chama a API ao carregar mais quando não há próxima página', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    store.loadMore();

    expect(dataService.getHistory).toHaveBeenCalledTimes(1);
  });

  it('expõe mensagem de erro ao carregar mais quando a chamada falhar', async () => {
    dataService.getHistory.and.returnValues(of(pageOf([entry], true)), throwError(() => new HttpErrorResponse({ status: 500 })));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    store.loadMore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.loadMoreError()).toBe('Erro ao carregar mais eventos do histórico');
    expect(store.loadingMore()).toBeFalse();
  });

  it('reload() descarta as páginas acumuladas e recarrega a primeira', async () => {
    const older: TicketHistoryEntry = { ...entry, id: 'h0', occurredAtUtc: '2025-12-01T12:00:00Z' };
    dataService.getHistory.and.returnValues(of(pageOf([entry], true)), of(pageOf([older])), of(pageOf([entry], true)));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    store.loadMore();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.entries()).toEqual([entry, older]);

    store.reload();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.entries()).toEqual([entry]);
    expect(store.hasMore()).toBeTrue();
  });

  it('expõe mensagem de erro quando o carregamento inicial falhar', async () => {
    dataService.getHistory.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao carregar o histórico');
  });
});
