import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MyTicketsSummaryStore } from './my-tickets-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { OwnTicketCount } from '../entities/own-ticket-count';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService } from '../../shared';

describe('MyTicketsSummaryStore', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;
  let permissions: Set<string>;

  /** Contagens como a API devolve: por status e prioridade, que o Store soma por status. */
  const summary: OwnTicketCount[] = [
    { status: TicketStatus.Open, priority: TicketPriority.High, count: 2 },
    { status: TicketStatus.Open, priority: TicketPriority.Low, count: 1 },
    { status: TicketStatus.InProgress, priority: TicketPriority.Medium, count: 4 },
    { status: TicketStatus.Resolved, priority: TicketPriority.Low, count: 5 },
    { status: TicketStatus.Closed, priority: TicketPriority.Low, count: 1 },
    { status: TicketStatus.Canceled, priority: TicketPriority.Low, count: 9 }
  ];

  /** Cria o Store com o Data Service falso e as permissões do teste. */
  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { hasPermission: (code: string) => permissions.has(code) } }
      ]
    });
    return TestBed.inject(MyTicketsSummaryStore);
  }

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getMineSummary']);
    dataService.getMineSummary.and.returnValue(of(summary));
    permissions = new Set(['tickets:view-own']);
  });

  it('soma as contagens por status (resolvidos inclui os fechados; cancelados ficam de fora)', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.openCount()).toBe(3);
    expect(store.inProgressCount()).toBe(4);
    expect(store.resolvedCount()).toBe(6);
    expect(store.failed()).toBeFalse();
  });

  it('soma os grupos do seletor de Meus Chamados: em aberto, encerrados (com os cancelados) e todos', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activeCount()).toBe(7);
    expect(store.finishedCount()).toBe(15);
    expect(store.totalCount()).toBe(22);
  });

  it('marca falha e não inventa 0 quando a API falha', async () => {
    dataService.getMineSummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.failed()).toBeTrue();
    expect(store.openCount()).toBeNull();
  });

  it('nem chama a API sem a permissão de ver os próprios chamados', async () => {
    permissions = new Set();
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMineSummary).not.toHaveBeenCalled();
    expect(store.openCount()).toBeNull();
  });

  it('busca de novo ao recarregar', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    store.reload();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMineSummary).toHaveBeenCalledTimes(2);
  });
});
