import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, computed, provideZonelessChangeDetection } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { Observable, Subject, of, throwError } from 'rxjs';
import { withTicketCursorPages } from './ticket-cursor-pages';
import { CursorPage, PageCursor } from '../../shared';

/** Item mínimo de uma listagem por cursor. */
interface Item {
  /** Id do item, o desempate do cursor. */
  id: string;
  /** Data do item, o cursor. */
  at: string;
}

describe('withTicketCursorPages', () => {
  const newest: Item = { id: 'i2', at: '2026-01-02T00:00:00Z' };
  const older: Item = { id: 'i1', at: '2026-01-01T00:00:00Z' };
  const otherTicketItem: Item = { id: 'j1', at: '2026-02-01T00:00:00Z' };

  /** Monta uma página por cursor com os itens dados; o cursor aponta para o último. */
  function pageOf(items: Item[], hasNextPage = false): CursorPage<Item> {
    const last = items[items.length - 1];
    return { items, nextCursorDate: last?.at ?? null, nextCursorId: last?.id ?? null, hasNextPage };
  }

  let fetchPage: jasmine.Spy<(ticketId: string, cursor?: PageCursor) => Observable<CursorPage<Item>>>;

  /** Store de teste: a listagem da feature e o que a Store que a usa faz com ela. */
  const ListStore = signalStore(
    withTicketCursorPages<Item>((...page) => fetchPage(...page), {
      readError: 'Erro ao carregar os itens',
      readStatusMessages: { 403: 'Você não tem acesso a estes itens.' },
      loadMoreError: 'Erro ao carregar mais itens'
    }),
    withComputed((store) => ({
      /** Itens já carregados. */
      items: computed(() => store._items()),
      /** Carregando e erro da primeira página. */
      state: computed(() => store._listState())
    })),
    withMethods((store) => ({
      /** Mostra o chamado. */
      load(ticketId: string): void {
        store._loadTicket(ticketId);
      },
      /** Recarrega a primeira página. */
      reload(): void {
        store._reloadFirstPage();
      }
    }))
  );

  let store: InstanceType<typeof ListStore>;

  /** Espera o resource e as respostas síncronas assentarem. */
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    fetchPage = jasmine.createSpy('fetchPage');
    fetchPage.and.returnValue(of(pageOf([newest])));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), ListStore] });
    store = TestBed.inject(ListStore);
  });

  it('does not fetch anything before a ticket is set', async () => {
    await settle();

    expect(fetchPage).not.toHaveBeenCalled();
    expect(store.items()).toEqual([]);
    expect(store.hasMore()).toBeFalse();
  });

  it('loads the first page of the ticket with only its id', async () => {
    store.load('t1');
    await settle();

    expect(fetchPage.calls.allArgs()).toEqual([['t1']]);
    expect(store.ticketId()).toBe('t1');
    expect(store.items()).toEqual([newest]);
  });

  it('loads the next page with the cursor of the last one and appends its items', async () => {
    fetchPage.and.returnValues(of(pageOf([newest], true)), of(pageOf([older])));
    store.load('t1');
    await settle();
    expect(store.hasMore()).toBeTrue();

    store.loadMore();
    await settle();

    expect(fetchPage).toHaveBeenCalledWith('t1', { cursorDate: newest.at, cursorId: 'i2' });
    expect(store.items()).toEqual([newest, older]);
    expect(store.hasMore()).toBeFalse();
    expect(store.loadingMore()).toBeFalse();
  });

  it('does not fetch more without a next page, nor while a page is still loading', async () => {
    store.load('t1');
    await settle();
    store.loadMore();
    expect(fetchPage).toHaveBeenCalledTimes(1);

    const next = new Subject<CursorPage<Item>>();
    fetchPage.and.returnValues(of(pageOf([newest], true)), next);
    store.reload();
    await settle();

    store.loadMore();
    store.loadMore();
    expect(store.loadingMore()).toBeTrue();
    expect(fetchPage).toHaveBeenCalledTimes(3);

    next.next(pageOf([older]));
    next.complete();
    expect(store.loadingMore()).toBeFalse();
    expect(store.items()).toEqual([newest, older]);
  });

  it('keeps the failure of loading more apart and clears it on the next attempt', async () => {
    fetchPage.and.returnValues(of(pageOf([newest], true)), throwError(() => new HttpErrorResponse({ status: 500 })), of(pageOf([older])));
    store.load('t1');
    await settle();

    store.loadMore();
    await settle();
    expect(store.loadMoreError()).toBe('Erro ao carregar mais itens');
    expect(store.loadingMore()).toBeFalse();
    expect(store.items()).toEqual([newest]);

    store.loadMore();
    await settle();
    expect(store.loadMoreError()).toBeNull();
    expect(store.items()).toEqual([newest, older]);
  });

  it('reloading discards the accumulated pages and fetches the first one again', async () => {
    fetchPage.and.returnValues(of(pageOf([newest], true)), of(pageOf([older])), of(pageOf([newest], true)));
    store.load('t1');
    await settle();
    store.loadMore();
    await settle();
    expect(store.items()).toEqual([newest, older]);

    store.reload();
    await settle();

    expect(fetchPage.calls.mostRecent().args).toEqual(['t1']);
    expect(store.items()).toEqual([newest]);
    expect(store.hasMore()).toBeTrue();
  });

  it('exposes the reading state of the first page, with the status sentences and the generic text', async () => {
    const first = new Subject<CursorPage<Item>>();
    fetchPage.and.returnValues(first, throwError(() => new HttpErrorResponse({ status: 403 })), throwError(() => new HttpErrorResponse({ status: 500 })));
    store.load('t1');
    TestBed.tick();
    expect(fetchPage).toHaveBeenCalledOnceWith('t1');
    expect(store.state()).toEqual({ loading: true, error: null });

    first.next(pageOf([newest]));
    first.complete();
    await settle();
    expect(store.state()).toEqual({ loading: false, error: null });

    store.reload();
    await settle();
    expect(store.state()).toEqual({ loading: false, error: 'Você não tem acesso a estes itens.' });

    store.reload();
    await settle();
    expect(store.state()).toEqual({ loading: false, error: 'Erro ao carregar os itens' });
  });

  it('loading the same ticket again reloads its first page, and another ticket starts from its own', async () => {
    fetchPage.and.returnValues(of(pageOf([newest], true)), of(pageOf([older])), of(pageOf([newest])), of(pageOf([otherTicketItem])));
    store.load('t1');
    await settle();
    store.loadMore();
    await settle();

    store.load('t1');
    await settle();
    expect(store.items()).toEqual([newest]);

    store.load('t2');
    await settle();
    expect(fetchPage.calls.allArgs()).toEqual([['t1'], ['t1', { cursorDate: newest.at, cursorId: 'i2' }], ['t1'], ['t2']]);
    expect(store.items()).toEqual([otherTicketItem]);
  });
});
