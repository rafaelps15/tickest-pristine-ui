import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketDataService } from './ticket.data.service';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketStatusGroup } from '../entities/ticket-status-group';
import { environment } from '../../../environments/environment';

describe('TicketDataService', () => {
  let service: TicketDataService;
  let http: HttpTestingController;
  /** Base da API, como o Data Service monta as URLs. */
  const api = environment.apiUrl;
  /** Página por offset vazia, como o back-end responde. */
  const emptyPage = { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  /** Página de cursor vazia, como o back-end responde. */
  const emptyCursorPage = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TicketDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('status changes', () => {
    it('close posts to /tickets/{id}/close without a body', () => {
      service.close('t1').subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets/t1/close'));
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('update puts only the description and the status to /tickets/{ticketId}', () => {
      service.update('t1', { description: 'A VPN cai a cada 10 minutos.', status: TicketStatus.Resolved }).subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${api}/tickets/t1` });
      expect(request.request.body).toEqual({ description: 'A VPN cai a cada 10 minutos.', status: TicketStatus.Resolved });
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('reopen posts the reason to /tickets/{ticketId}/reopen and, without a reason, goes without a body', () => {
      service.reopen('t1', 'Voltou a cair.').subscribe();
      service.reopen('t2').subscribe();

      const withReason = http.expectOne({ method: 'POST', url: `${api}/tickets/t1/reopen` });
      expect(withReason.request.body).toEqual({ reason: 'Voltou a cair.' });
      withReason.flush(null, { status: 204, statusText: 'No Content' });
      const withoutReason = http.expectOne({ method: 'POST', url: `${api}/tickets/t2/reopen` });
      expect(withoutReason.request.body).toBeNull();
      withoutReason.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('creation, deletion and assignee', () => {
    it('create posts the title, the description, the priority, the sector and the requester to /tickets and returns the new id', () => {
      const data = { title: 'VPN caindo', description: 'A VPN cai a cada 10 minutos.', priority: TicketPriority.High, sectorId: 's1', requesterId: 'u9' };
      let received: string | undefined;

      service.create(data).subscribe(value => received = value);

      const request = http.expectOne({ method: 'POST', url: `${api}/tickets` });
      expect(request.request.body).toEqual(data);
      request.flush('t1');
      expect(received).toBe('t1');
    });

    it('delete sends DELETE /tickets/{ticketId}, without a body', () => {
      service.delete('t1').subscribe();

      const request = http.expectOne({ method: 'DELETE', url: `${api}/tickets/t1` });
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('assignTicket puts the new assignee to /tickets/{ticketId}/assignee', () => {
      service.assignTicket('t1', 'u1').subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${api}/tickets/t1/assignee` });
      expect(request.request.body).toEqual({ assignedToUserId: 'u1' });
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('removeAssignee sends DELETE /tickets/{ticketId}/assignee, without a body', () => {
      service.removeAssignee('t1').subscribe();

      const request = http.expectOne({ method: 'DELETE', url: `${api}/tickets/t1/assignee` });
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('reads', () => {
    it('getMine sends the page, the status group and the trimmed search to GET /tickets/mine; without a group or a search, only the page', () => {
      service.getMine(2, 10, TicketStatusGroup.Finished, '  vpn  ').subscribe();
      service.getMine(1, 20).subscribe();

      http.expectOne({ method: 'GET', url: `${api}/tickets/mine?page=2&pageSize=10&status=2&search=vpn` }).flush(emptyPage);
      const plain = http.expectOne({ method: 'GET', url: `${api}/tickets/mine?page=1&pageSize=20` });
      expect(plain.request.body).toBeNull();
      plain.flush(emptyPage);
    });

    it('getById reads the ticket detail from GET /tickets/{ticketId}', () => {
      const detail = { id: 't1', title: 'VPN caindo' };
      let received: unknown;

      service.getById('t1').subscribe(value => received = value);

      http.expectOne({ method: 'GET', url: `${api}/tickets/t1` }).flush(detail);
      expect(received).toEqual(detail);
    });

    it('getSla reads only the SLA block from GET /tickets/{ticketId}/sla', () => {
      const sla = { serverNowUtc: '2026-10-28T12:00:00Z', plan: null, objectives: [] };
      let received: unknown;

      service.getSla('t1').subscribe(value => received = value);

      http.expectOne({ method: 'GET', url: `${api}/tickets/t1/sla` }).flush(sla);
      expect(received).toEqual(sla);
    });

    it('getHistory reads the first page from GET /tickets/{ticketId}/history without a cursor, and the next one with the cursor and the page size', () => {
      service.getHistory('t1').subscribe();
      service.getHistory('t1', { cursorDate: '2026-10-28T12:00:00Z', cursorId: 'h9' }, 15).subscribe();

      http.expectOne({ method: 'GET', url: `${api}/tickets/t1/history` }).flush(emptyCursorPage);
      const next = http.expectOne({ method: 'GET', url: `${api}/tickets/t1/history?cursorDate=2026-10-28T12:00:00Z&cursorId=h9&pageSize=15` });
      expect(next.request.body).toBeNull();
      next.flush(emptyCursorPage);
    });

    it('getSlaSummary reads GET /tickets/sla-summary for the whole company, or for one sector', () => {
      const summary = { activeCount: 3, onTimeCount: 1, atRiskCount: 1, breachedCount: 1, serverNowUtc: '2026-10-28T12:00:00Z' };
      const received: unknown[] = [];

      service.getSlaSummary().subscribe(value => received.push(value));
      service.getSlaSummary('s1').subscribe(value => received.push(value));

      http.expectOne({ method: 'GET', url: `${api}/tickets/sla-summary` }).flush(summary);
      http.expectOne({ method: 'GET', url: `${api}/tickets/sla-summary?sectorId=s1` }).flush(summary);
      expect(received).toEqual([summary, summary]);
    });

    it('getMineSummary reads the counts of the own tickets from GET /tickets/mine/summary', () => {
      const counts = [{ priority: TicketPriority.High, status: TicketStatus.Open, count: 2 }];
      let received: unknown;

      service.getMineSummary().subscribe(value => received = value);

      http.expectOne({ method: 'GET', url: `${api}/tickets/mine/summary` }).flush(counts);
      expect(received).toEqual(counts);
    });

    it('getStatusCounts reads the company totals by status from GET /tickets/stats/status, without a selection', () => {
      const counts = { totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0 };
      let received: unknown;

      service.getStatusCounts().subscribe(value => received = value);

      http.expectOne({ method: 'GET', url: `${api}/tickets/stats/status` }).flush(counts);
      expect(received).toEqual(counts);
    });
  });

  describe('selection statistics', () => {
    it('getOverview sends repeated sectors, priority, assignee and the opening period', () => {
      service.getOverview({ sectorIds: ['s1', 's2'], priority: TicketPriority.Urgent, assignedToUserId: 'u1', createdFrom: '2026-10-01', createdTo: '2026-10-28' }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets/stats/overview'));
      expect(request.request.params.getAll('sectorId')).toEqual(['s1', 's2']);
      expect(request.request.params.get('priority')).toBe('4');
      expect(request.request.params.get('assignedToUserId')).toBe('u1');
      expect(request.request.params.get('createdFrom')).toBe('2026-10-01');
      expect(request.request.params.get('createdTo')).toBe('2026-10-28');
      request.flush({});
    });

    it('"sem responsável" ignores the assignee', () => {
      service.getTimes({ unassignedOnly: true, assignedToUserId: 'u1', resolvedFrom: '2026-10-01' }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets/stats/times'));
      expect(request.request.params.get('unassignedOnly')).toBe('true');
      expect(request.request.params.has('assignedToUserId')).toBeFalse();
      expect(request.request.params.get('resolvedFrom')).toBe('2026-10-01');
      request.flush({});
    });

    it('getVolume sends the grouping and the selection; without a selection, only the grouping', () => {
      service.getVolume('Week', { sectorIds: ['s1'], createdFrom: '2026-09-01' }).subscribe();
      service.getVolume('Day').subscribe();

      const [filtered, plain] = http.match(req => req.url.endsWith('/tickets/stats/volume'));
      expect(filtered.request.params.get('groupBy')).toBe('Week');
      expect(filtered.request.params.getAll('sectorId')).toEqual(['s1']);
      expect(filtered.request.params.get('createdFrom')).toBe('2026-09-01');
      expect(plain.request.params.keys()).toEqual(['groupBy']);
      filtered.flush([]);
      plain.flush([]);
    });

    it('getAssignees requests the paginated list with search and sector', () => {
      service.getAssignees(' ana ', 's1').subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets/assignees'));
      expect(request.request.params.get('search')).toBe('ana');
      expect(request.request.params.get('sectorId')).toBe('s1');
      expect(request.request.params.get('page')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('100');
      request.flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });
  });

  describe('getAll', () => {
    it('with "Ativos" and no status chosen, sends Aberto and Em Andamento', () => {
      service.getAll({ activeOnly: true, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.getAll('status')).toEqual(['1', '2']);
      request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });

    it('a chosen status wins over the "Ativos" group', () => {
      service.getAll({ status: TicketStatus.Resolved, activeOnly: true, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.getAll('status')).toEqual(['3']);
      request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });

    it('sends several sectors, the opening period and the "aguardando" filter', () => {
      service.getAll({ sectorIds: ['s1', 's2'], createdFrom: '2026-10-01', createdTo: '2026-10-28', awaiting: TicketAwaiting.Agent, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.getAll('sectorId')).toEqual(['s1', 's2']);
      expect(request.request.params.get('createdFrom')).toBe('2026-10-01');
      expect(request.request.params.get('createdTo')).toBe('2026-10-28');
      expect(request.request.params.get('waitingOn')).toBe('2');
      expect(request.request.params.has('awaiting')).toBeFalse();
      request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });
  });
});
