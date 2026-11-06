import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, Subject } from 'rxjs';
import { TicketMonitorStore } from './ticket-monitor.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketDashboardOverview } from '../entities/ticket-dashboard';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketSlaSummary } from '../entities/ticket-sla-summary';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { PagedResponse } from '../../shared';
import { TicketAssignee } from '../entities/ticket-assignee';

/** Página de candidatos a responsável como GET /tickets/assignees devolve. */
function assigneePage(items: TicketAssignee[]): PagedResponse<TicketAssignee> {
  return { items, page: 1, pageSize: 8, totalCount: items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
}


describe('TicketMonitorStore', () => {
  const ticket: TicketMonitorItem = {
    id: 't1', title: 'Impressora não funciona', priority: TicketPriority.High, status: TicketStatus.Open,
    requesterId: 'u1', requesterName: 'Maria Silva', requesterEmail: 'maria@empresa.com',
    assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };
  const slaSummary: TicketSlaSummary = { activeCount: 10, onTimeCount: 6, atRiskCount: 3, breachedCount: 1, serverNowUtc: '2026-01-01T12:00:00Z' };
  /** O agregado da operação que gera o resumo acima (ativos = backlog; no prazo, em risco e atrasados do SLA). */
  const overview: TicketDashboardOverview = {
    serverNowUtc: '2026-01-01T12:00:00Z',
    volume: { totalCount: 30, openCount: 4, inProgressCount: 6, resolvedCount: 15, closedCount: 5, canceledCount: 0, backlogCount: 10 },
    sla: { onTimeCount: 6, atRiskCount: 3, breachedCount: 1, metCount: 12, missedCount: 3, notApplicableCount: 0 },
    attention: { breachedCount: 1, criticalCount: 0, unassignedCount: 2 }
  };

  function pageOf(items: TicketMonitorItem[], page = 1, totalCount = items.length, pageSize = 20): PagedResponse<TicketMonitorItem> {
    const totalPages = Math.ceil(totalCount / pageSize);
    return { items, page, pageSize, totalCount, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages };
  }

  const candidate: TicketAssignee = { id: 'u2', fullName: 'João Pedro', sectorId: 's1', sectorName: 'Suporte' };

  let store: InstanceType<typeof TicketMonitorStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getAll', 'getOverview', 'assignTicket', 'getAssignees']);
    dataService.getAll.and.returnValue(of(pageOf([ticket])));
    dataService.getOverview.and.returnValue(of(overview));
    dataService.getAssignees.and.returnValue(of({
      items: [candidate], page: 1, pageSize: 8, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false
    }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketMonitorStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketMonitorStore);
  });

  it('loads the first page of tickets and the SLA summary with the default filters', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith({ activeOnly: true, sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 });
    expect(dataService.getOverview).toHaveBeenCalledWith({
      sectorIds: undefined, priority: undefined, unassignedOnly: undefined, assignedToUserId: undefined, createdFrom: undefined, createdTo: undefined
    });
    expect(store.tickets()).toEqual([ticket]);
    expect(store.total()).toBe(1);
    expect(store.slaSummary()).toEqual(jasmine.objectContaining(slaSummary));
  });

  it('exposes the error message when the listing fails', async () => {
    dataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Você não tem permissão para monitorar os chamados do sistema.');
  });

  it('exposes the error message when the SLA summary fails, and reloads when calling reloadSlaSummary', async () => {
    dataService.getOverview.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.slaSummaryState().error).toBe('Erro ao carregar o resumo de SLA');

    dataService.getOverview.calls.reset();
    dataService.getOverview.and.returnValue(of(overview));
    store.reloadSlaSummary();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getOverview).toHaveBeenCalled();
    expect(store.slaSummaryState().error).toBeNull();
  });

  it('clears the assignment error when calling clearMutationError', async () => {
    dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    store.assignToMe('t1', 'u1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.mutationError()).toBeTruthy();

    store.clearMutationError();

    expect(store.mutationError()).toBeNull();
  });

  it('filters by status and goes back to the first page', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(1);

    store.setStatus(TicketStatus.Open);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: TicketStatus.Open, page: 1 }));
  });

  it('filters by priority', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setPriority(TicketPriority.Urgent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ priority: TicketPriority.Urgent }));
  });

  it('the top numbers follow sectors (several), priority, assignee and period, like the table', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSectorIds(['s1', 's2']);
    store.setPriority(TicketPriority.Urgent);
    store.setAssignedToUserId('u2');
    store.setCreatedRange('2026-10-01', '2026-10-28');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
    expect(dataService.getOverview).toHaveBeenCalledWith({
      sectorIds: ['s1', 's2'], priority: TicketPriority.Urgent, unassignedOnly: undefined, assignedToUserId: 'u2',
      createdFrom: '2026-10-01', createdTo: '2026-10-28'
    });
  });

  it('the search, the SLA and the Aguardando apply only to the table: they do not redo the top numbers', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    const calls = dataService.getOverview.calls.count();

    store.setSearch('impressora');
    store.setSlaStatus(TicketSlaStatus.Breached);
    store.setAwaiting(TicketAwaiting.Agent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getOverview.calls.count()).toBe(calls);
  });

  it('filters by opening period and by "aguardando", going back to page 1', async () => {
    store.goToPage(3);
    store.setCreatedRange('2026-10-01', '2026-10-28');
    store.setAwaiting(TicketAwaiting.Agent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({
      createdFrom: '2026-10-01', createdTo: '2026-10-28', awaiting: TicketAwaiting.Agent, page: 1
    }));
  });

  it('filters by SLA status', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSlaStatus(TicketSlaStatus.Breached);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ slaStatus: TicketSlaStatus.Breached }));
  });

  it('searches by term', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSearch('impressora');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'impressora' }));
  });

  it('filters only by tickets without an assignee', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setUnassignedOnly(true);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ unassignedOnly: true, page: 1 }));
  });

  it('filters by the tickets of one assignee, turning off "só sem responsável" (and vice versa)', () => {
    store.setUnassignedOnly(true);
    store.setAssignedToUserId('u1');
    expect(store.filters()).toEqual(jasmine.objectContaining({ assignedToUserId: 'u1', unassignedOnly: undefined, page: 1 }));

    store.setUnassignedOnly(true);
    expect(store.filters()).toEqual(jasmine.objectContaining({ assignedToUserId: undefined, unassignedOnly: true }));
  });

  it('changes the sort order', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSort(TicketSortOrder.DueDate);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sort: TicketSortOrder.DueDate }));
  });

  it('navigates to the given page', async () => {
    dataService.getAll.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ page: 2 }));
  });

  it('changes the page size and goes back to the first page', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(2);

    store.setPageSize(50);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ pageSize: 50, page: 1 }));
  });

  it('assigns the ticket to the given user and reloads the listing', async () => {
    dataService.assignTicket.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();

    store.assignToMe('t1', 'u-current');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u-current');
    expect(dataService.getAll).toHaveBeenCalled();
    expect(store.mutationError()).toBeNull();
    expect(store.assigningToMeIds()).toEqual([]);
  });

  it('marks only the ticket in question as "atribuindo", without affecting others, while the assignment is in flight', async () => {
    let resolveAssign!: () => void;
    dataService.assignTicket.and.returnValue(new Observable<void>(subscriber => {
      resolveAssign = () => { subscriber.next(); subscriber.complete(); };
    }));
    await TestBed.inject(ApplicationRef).whenStable();

    store.assignToMe('t1', 'u-current');

    expect(store.assigningToMeIds()).toEqual(['t1']);
    expect(store.assigningToMeIds()).not.toContain('t2');

    resolveAssign();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.assigningToMeIds()).toEqual([]);
  });

  it('shows a specific message per error code when the assignment fails, without reloading the listing', async () => {
    dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();

    store.assignToMe('t1', 'u-current');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toContain('já ter outro responsável');
    expect(store.assigningToMeIds()).toEqual([]);
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('calls onSuccess after reloading the listing, on a successful assignment', async () => {
    dataService.assignTicket.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignToMe('t1', 'u-current', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('does not search for assignee candidates with an empty term', () => {
    store.searchResponsibleCandidates('');

    expect(dataService.getAssignees).not.toHaveBeenCalled();
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('searches for assignee candidates by the given term', async () => {
    store.searchResponsibleCandidates('joão');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAssignees).toHaveBeenCalledWith('joão', undefined, 1, 8);
    expect(store.responsibleCandidates()).toEqual([candidate]);
  });

  it('shows its own message when the assignee search is denied (403)', async () => {
    dataService.getAssignees.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.searchResponsibleCandidates('joão');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.responsibleSearchError()).toBe('Você não tem permissão para buscar responsáveis.');
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('clears the assignee candidate search', () => {
    store.searchResponsibleCandidates('joão');
    store.clearResponsibleSearch();

    expect(store.responsibleCandidates()).toEqual([]);
    expect(store.responsibleSearchError()).toBeNull();
  });

  it('cancels the previous search when another one starts: only the response of the last term is shown', async () => {
    const first = new Subject<PagedResponse<TicketAssignee>>();
    const second = new Subject<PagedResponse<TicketAssignee>>();
    const late: TicketAssignee = { ...candidate, id: 'u-late', fullName: 'Joana Dias' };
    dataService.getAssignees.and.returnValues(first, second);

    store.searchResponsibleCandidates('jo');
    TestBed.tick();
    expect(store.searchingResponsibleCandidates()).toBeTrue();
    store.searchResponsibleCandidates('joão');
    TestBed.tick();

    expect(first.observed).withContext('a primeira busca é cancelada').toBeFalse();
    second.next(assigneePage([candidate]));
    second.complete();
    first.next(assigneePage([late]));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.responsibleCandidates()).toEqual([candidate]);
    expect(store.searchingResponsibleCandidates()).toBeFalse();
    expect(dataService.getAssignees.calls.allArgs()).toEqual([['jo', undefined, 1, 8], ['joão', undefined, 1, 8]]);
  });

  it('assigns the chosen assignee, reloads the listing and calls onSuccess', async () => {
    dataService.assignTicket.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignResponsible('t1', 'u2', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u2');
    expect(dataService.getAll).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(store.assigningResponsible()).toBeFalse();
    expect(store.mutationError()).toBeNull();
  });

  it('shows a specific message per error code when the assignee assignment fails, without reloading the listing', async () => {
    dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();

    store.assignResponsible('t1', 'u2');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Chamado ou usuário não encontrado.');
    expect(store.assigningResponsible()).toBeFalse();
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('clears the filters, going back to the default state', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.setStatus(TicketStatus.Open);
    store.setSearch('impressora');

    store.clearFilters();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith({ activeOnly: true, sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 });
  });

  it('records the time the list arrived ("Atualizado às"), and none before the first load', async () => {
    expect(store.listLoadedAtMs()).toBeNull();
    const before = Date.now();

    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listLoadedAtMs()).toBeGreaterThanOrEqual(before);
  });

  it('when clearing the filters, keeps the sector (screen scope) and the "Por página"', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.setSectorIds(['s1']);
    store.setPageSize(50);
    store.setStatus(TicketStatus.Open);

    store.clearFilters();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith({ activeOnly: true, sort: TicketSortOrder.DueDate, page: 1, pageSize: 50, sectorIds: ['s1'] });
  });
});
