import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { TicketsStore } from './tickets.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { Ticket, TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketStatusGroup } from '../entities/ticket-status-group';
import { PagedResponse, SessionService } from '../../shared';
import { environment } from '../../../environments/environment';

/** O chamado t1 relido pelo GET /tickets/{id}: alguém mudou a descrição depois que a lista carregou. */
const freshTicket: TicketDetail = {
  id: 't1', title: 'Impressora não funciona', description: 'Descrição mudada por outra pessoa depois da carga.',
  priority: TicketPriority.Medium, status: TicketStatus.Open,
  openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Helpdesk',
  createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z', resolvedAtUtc: null,
  slaStatus: TicketSlaStatus.OnTime, canCancel: true, ownerCancelDeadlineUtc: '2026-01-01T12:15:00Z',
  sla: { serverNowUtc: '2026-01-01T12:05:00Z', plan: { policyId: 'p1', policyName: 'Padrão', policyVersion: 1, calendarId: 'c1', calendarName: 'Expediente', isLegacy: false }, objectives: [] }
};

describe('TicketsStore', () => {
  const ticket: Ticket = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Helpdesk',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaStatus: TicketSlaStatus.OnTime,
    currentDueAtUtc: '2026-01-02T12:00:00Z', currentSlaStatus: TicketSlaStatus.OnTime,
    lastActivityAtUtc: '2026-01-01T12:00:00Z', canCancel: true, ownerCancelDeadlineUtc: '2026-01-01T12:15:00Z'
  };

  /** Monta uma página paginada por offset com os tickets informados. */
  function pageOf(items: Ticket[], page: number, totalCount: number, pageSize = 20): PagedResponse<Ticket> {
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      items, page, pageSize, totalCount, totalPages,
      hasPreviousPage: page > 1, hasNextPage: page < totalPages
    };
  }

  let store: InstanceType<typeof TicketsStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getMine', 'getById', 'update', 'reopen']);
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 1)));
    dataService.getById.and.returnValue(of(freshTicket));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketsStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId: signal('u1') } }
      ]
    });
    store = TestBed.inject(TicketsStore);
  });

  it('loads the first page of the tickets of the logged-in user', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(1, 20, TicketStatusGroup.Active, '');
    expect(store.tickets()).toEqual([ticket]);
    expect(store.total()).toBe(1);
  });

  it('fetches the requested page when changing page', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(2, 20, TicketStatusGroup.Active, '');
  });

  it('ignores out-of-range pages', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(5);
    store.goToPage(0);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledTimes(1);
  });

  it('goes back to the first page when changing the page size', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    store.setPageSize(50);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(1, 50, TicketStatusGroup.Active, '');
  });

  it('updates the description with the status of the ticket re-read just before the PUT, and reloads the listing', async () => {
    dataService.update.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledOnceWith('t1');
    expect(dataService.update).toHaveBeenCalledWith('t1', { description: 'Atualizado', status: TicketStatus.Open });
    expect(dataService.getMine).toHaveBeenCalledTimes(2);
    expect(store.mutationError()).toBeNull();
  });

  it('exposes an error message when the update fails', async () => {
    dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Erro ao atualizar o chamado');
  });

  it('cancels with the description re-read just before the PUT, not the one loaded on the screen (DIV-3)', async () => {
    dataService.update.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { status: TicketStatus.Canceled });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledBefore(dataService.update);
    expect(dataService.update).toHaveBeenCalledOnceWith('t1', { description: freshTicket.description, status: TicketStatus.Canceled });
  });

  it('does not send the PUT when the re-read fails, shows the error and releases the row', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { status: TicketStatus.Canceled });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.update).not.toHaveBeenCalled();
    expect(store.mutationError()).toBe('Chamado não encontrado — ele pode ter sido removido.');
    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('calls onSuccess when a ticket is updated successfully', async () => {
    dataService.update.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { status: TicketStatus.Canceled }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('marks the ticket as pending during the update, and releases it when done', async () => {
    const subject = new Subject<void>();
    dataService.update.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { status: TicketStatus.Canceled });
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('reopens a ticket and reloads the listing', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.reopen).toHaveBeenCalledWith('t1', null);
    expect(dataService.getMine).toHaveBeenCalledTimes(2);
    expect(store.mutationError()).toBeNull();
  });

  it('exposes an error message when the reopening fails', async () => {
    dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Erro ao reabrir o chamado');
  });

  it('marks the ticket as pending during the reopening, and releases it when done', async () => {
    const subject = new Subject<void>();
    dataService.reopen.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('separates the mutation error from the read error, and discards the mutation one on request', async () => {
    dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.loadError()).toBeNull();
    expect(store.mutationError()).toBe('Erro ao reabrir o chamado');

    store.clearMutationError();
    expect(store.mutationError()).toBeNull();
  });

  it('keeps a failed mutation out of the read state, so the list does not look like it failed to load', async () => {
    dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Erro ao atualizar o chamado');
    expect(store.state().error).toBeNull();
    expect(store.tickets()).toEqual([ticket]);
  });

  it('exposes a read failure in the read state, without a mutation error', async () => {
    dataService.getMine.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao carregar chamados');
    expect(store.mutationError()).toBeNull();
  });

  it('starts on "Em aberto" and with no search, and goes back to the first page when the group or the search changes', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.statusGroup()).toBe(TicketStatusGroup.Active);
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    store.setStatusGroup(TicketStatusGroup.Finished);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getMine).toHaveBeenCalledWith(1, 20, TicketStatusGroup.Finished, '');

    store.setStatusGroup(null);
    store.setSearch('  impressora  ');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getMine.calls.mostRecent().args).toEqual([1, 20, null, 'impressora']);
  });

  it('does not search again when the group or the term do not change', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    const calls = dataService.getMine.calls.count();

    store.setStatusGroup(TicketStatusGroup.Active);
    store.setSearch('   ');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine.calls.count()).toBe(calls);
  });

  it('with the filtered list empty, makes no other request to know whether the person has any ticket', async () => {
    dataService.getMine.and.returnValue(of(pageOf([], 1, 0)));
    await TestBed.inject(ApplicationRef).whenStable();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.tickets()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(dataService.getMine.calls.allArgs()).toEqual([[1, 20, TicketStatusGroup.Active, '']]);
  });

  it('with the read in error, exposes the empty list and the error, without throwing an exception', async () => {
    dataService.getMine.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.tickets()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.ticketsPage()).toBeUndefined();
    expect(store.loadError()).toBe('Erro ao carregar chamados');
  });

  it('reopens sending the reason in the reopen call itself (a single call), and calls onSuccess', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.reopen('t1', 'O problema voltou depois da atualização.', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.reopen).toHaveBeenCalledWith('t1', 'O problema voltou depois da atualização.');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the back-end message when the reopening is refused', async () => {
    dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403, error: { detail: 'Você não tem permissão para reabrir este chamado.' }
    })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', 'motivo');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Você não tem permissão para reabrir este chamado.');
  });
});

describe('TicketsStore with the real TicketDataService (C-40)', () => {
  const mineUrl = `${environment.apiUrl}/tickets/mine`;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TicketsStore,
        { provide: SessionService, useValue: { userId: signal('u1') } }
      ]
    });
    TestBed.inject(TicketsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('with the filtered list empty, Meus Chamados sends only the GET of the list, without the "tem algum chamado?" probe', async () => {
    TestBed.tick();
    const list = http.expectOne(request => request.method === 'GET' && request.url === mineUrl);
    expect(list.request.params.get('status')).toBe(String(TicketStatusGroup.Active));
    expect(list.request.params.get('pageSize')).toBe('20');
    list.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
    await TestBed.inject(ApplicationRef).whenStable();

    http.expectNone(request => request.url === mineUrl);
  });
});

describe('TicketsStore with the real TicketDataService (DIV-3)', () => {
  const url = `${environment.apiUrl}/tickets/t1`;
  let store: InstanceType<typeof TicketsStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TicketsStore,
        // Sem usuário na sessão, a lista não carrega: só as requisições do cancelar passam pelo HttpTestingController.
        { provide: SessionService, useValue: { userId: signal<string | null>(null) } }
      ]
    });
    store = TestBed.inject(TicketsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cancelling in Meus Chamados re-reads the ticket just before the PUT and sends the re-read description', () => {
    const onSuccess = jasmine.createSpy('onSuccess');

    store.update('t1', { status: TicketStatus.Canceled }, onSuccess);

    http.expectNone({ method: 'PUT', url });
    http.expectOne({ method: 'GET', url }).flush(freshTicket);
    const put = http.expectOne({ method: 'PUT', url });
    expect(put.request.body).toEqual({ description: freshTicket.description, status: TicketStatus.Canceled });
    put.flush(null);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('when the re-read fails, sends no PUT and shows the error', () => {
    store.update('t1', { status: TicketStatus.Canceled });

    http.expectOne({ method: 'GET', url }).flush(null, { status: 500, statusText: 'Server Error' });
    http.expectNone({ method: 'PUT', url });
    expect(store.mutationError()).toBe('Erro ao atualizar o chamado');
  });
});
