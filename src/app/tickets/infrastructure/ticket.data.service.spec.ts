import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketDataService } from './ticket.data.service';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
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

  describe('count', () => {
    it('pede uma página de 1 item e devolve o totalCount do servidor', () => {
      let result: number | undefined;
      service.count({ statuses: [TicketStatus.Open, TicketStatus.InProgress], priority: TicketPriority.Urgent, sectorId: 's1' })
        .subscribe(total => result = total);

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.get('page')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('1');
      expect(request.request.params.getAll('status')).toEqual(['1', '2']);
      expect(request.request.params.get('priority')).toBe('4');
      expect(request.request.params.get('sectorId')).toBe('s1');
      request.flush({ items: [{}], page: 1, pageSize: 1, totalCount: 37, totalPages: 37, hasNextPage: true, hasPreviousPage: false });

      expect(result).toBe(37);
    });

    it('"sem responsável" ignora o responsável, e a situação do SLA vai como número', () => {
      service.count({ unassignedOnly: true, assignedToUserId: 'u1', slaStatus: TicketSlaStatus.Breached }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.get('unassignedOnly')).toBe('true');
      expect(request.request.params.has('assignedToUserId')).toBeFalse();
      expect(request.request.params.get('slaStatus')).toBe('3');
      request.flush({ items: [], page: 1, pageSize: 1, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });
  });

  describe('getAll', () => {
    it('com "Ativos" e sem status escolhido, manda Aberto e Em Andamento', () => {
      service.getAll({ activeOnly: true, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.getAll('status')).toEqual(['1', '2']);
      request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });

    it('um status escolhido vence o grupo "Ativos"', () => {
      service.getAll({ status: TicketStatus.Resolved, activeOnly: true, sort: TicketSortOrder.Newest, page: 1, pageSize: 20 }).subscribe();

      const request = http.expectOne(req => req.url.endsWith('/tickets'));
      expect(request.request.params.getAll('status')).toEqual(['3']);
      request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    });
  });
});
