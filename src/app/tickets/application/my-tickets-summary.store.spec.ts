import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { MyTicketsSummaryStore } from './my-tickets-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { OwnTicketCount } from '../entities/own-ticket-count';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService } from '../../shared';

describe('MyTicketsSummaryStore', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;
  let permissions: Set<string>;
  /** Quem está logado (troca no meio do teste = logout e login de outra pessoa, sem recarregar a página). */
  let userId: ReturnType<typeof signal<string | null>>;

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
        { provide: SessionService, useValue: { hasPermission: (code: string) => permissions.has(code), userId } }
      ]
    });
    return TestBed.inject(MyTicketsSummaryStore);
  }

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getMineSummary']);
    dataService.getMineSummary.and.returnValue(of(summary));
    permissions = new Set(['tickets:view-own']);
    userId = signal<string | null>('u-ana');
  });

  it('sums the counts by status (resolved includes closed; canceled are left out)', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.openCount()).toBe(3);
    expect(store.inProgressCount()).toBe(4);
    expect(store.resolvedCount()).toBe(6);
    expect(store.failed()).toBeFalse();
  });

  it('sums the Meus Chamados selector groups: open, closed (with the canceled) and all', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activeCount()).toBe(7);
    expect(store.finishedCount()).toBe(15);
    expect(store.totalCount()).toBe(22);
  });

  it('separates Resolvido and Fechado, to compare each with the same company number', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.resolvedOnlyCount()).toBe(5);
    expect(store.closedCount()).toBe(1);
  });

  it('flags failure and does not invent 0 when the API fails', async () => {
    dataService.getMineSummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.failed()).toBeTrue();
    expect(store.openCount()).toBeNull();
  });

  it('does not even call the API without the permission to see own tickets', async () => {
    permissions = new Set();
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMineSummary).not.toHaveBeenCalled();
    expect(store.openCount()).toBeNull();
  });

  it('fetches again on reload', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    store.reload();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMineSummary).toHaveBeenCalledTimes(2);
  });
  it('on a reload, the numbers stay (loading only on the first load; busy marks the reload)', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.totalCount()).toBe(22);

    dataService.getMineSummary.and.returnValue(NEVER);
    store.reload();
    TestBed.tick();

    expect(store.busy()).toBeTrue();
    expect(store.loading()).toBeFalse();
    expect(store.totalCount()).toBe(22);
  });

  it('a failed refresh keeps the last numbers (stale) and does not become "failed"', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    // A tela lê os números o tempo todo; é essa leitura que guarda os últimos bons.
    expect(store.activeCount()).toBe(7);

    dataService.getMineSummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.reload();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activeCount()).toBe(7);
    expect(store.stale()).toBeTrue();
    expect(store.failed()).toBeFalse();
  });

  it('with no number yet, the failure is "failed" (not stale)', async () => {
    dataService.getMineSummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.failed()).toBeTrue();
    expect(store.stale()).toBeFalse();
    expect(store.totalCount()).toBeNull();
  });
  it('another person signing in (without reloading the page) does not see the previous one\'s numbers: the summary resets and is fetched again', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.totalCount()).toBe(22);
    expect(dataService.getMineSummary).toHaveBeenCalledTimes(1);

    // Logout da Ana e login do Bruno; a primeira busca dele ainda não respondeu.
    dataService.getMineSummary.and.returnValue(NEVER);
    userId.set('u-bruno');
    TestBed.tick();

    expect(store.totalCount()).toBeNull();
    expect(store.loading()).toBeTrue();
    expect(dataService.getMineSummary).toHaveBeenCalledTimes(2);
  });

  it('if the other person\'s first fetch fails, they see the failure, never the previous one\'s numbers', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.activeCount()).toBe(7);

    dataService.getMineSummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    userId.set('u-bruno');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activeCount()).toBeNull();
    expect(store.failed()).toBeTrue();
    expect(store.stale()).toBeFalse();
  });

  it('after logout, no session number stays in the store', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.totalCount()).toBe(22);

    userId.set(null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.totalCount()).toBeNull();
  });
});
