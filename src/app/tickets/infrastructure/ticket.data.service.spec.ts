import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketDataService } from './ticket.data.service';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';

describe('TicketDataService', () => {
  let service: TicketDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TicketDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

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
