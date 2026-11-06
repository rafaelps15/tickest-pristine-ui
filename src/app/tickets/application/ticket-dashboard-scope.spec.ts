import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { dashboardScopeFilters, sameDashboardScope } from './ticket-dashboard-scope';
import { TicketDashboardStore } from './ticket-dashboard.store';
import { TicketSummaryStore } from './ticket-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDashboardOverview, TicketDashboardScope } from '../entities/ticket-dashboard';
import { TicketPriority } from '../entities/ticket-priority';
import { SessionService } from '../../shared';

/** Agregado mínimo devolvido pelo Data Service falso. */
const OVERVIEW: TicketDashboardOverview = {
  serverNowUtc: '2026-11-06T12:00:00Z',
  volume: { totalCount: 0, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0, backlogCount: 0 },
  sla: { onTimeCount: 0, atRiskCount: 0, breachedCount: 0, metCount: 0, missedCount: 0, notApplicableCount: 0 },
  attention: { breachedCount: 0, criticalCount: 0, unassignedCount: 0 }
};

/** Campos que só a listagem dos Alertas manda (situação do SLA, ordem e página), fora do recorte. */
const LIST_ONLY = ['slaStatus', 'sort', 'page', 'pageSize'];

/** Os filtros do recorte que de fato vão na requisição: sem as chaves vazias nem as da listagem. */
const scopeOf = (filters: object) =>
  Object.fromEntries(Object.entries(filters).filter(([key, value]) => value !== undefined && !LIST_ONLY.includes(key)));

describe('ticket-dashboard-scope', () => {
  describe('dashboardScopeFilters', () => {
    const noUser = () => null;

    it('takes sectors and priority as they are, without the period (each read applies it to its own date)', () => {
      expect(dashboardScopeFilters({ sectorIds: ['s1', 's2'], priority: TicketPriority.High, from: '2026-10-01', to: '2026-10-28' }, noUser))
        .toEqual({ sectorIds: ['s1', 's2'], priority: TicketPriority.High });
    });

    it('"sem responsável" becomes unassignedOnly, and a person goes by id', () => {
      expect(dashboardScopeFilters({ assignee: 'none' }, noUser)).toEqual(jasmine.objectContaining({ unassignedOnly: true }));
      expect(dashboardScopeFilters({ assignedToUserId: 'u-ana' }, noUser)).toEqual(jasmine.objectContaining({ assignedToUserId: 'u-ana' }));
    });

    it('"meus" becomes the logged-in user id; with nobody logged in, null (nothing is requested)', () => {
      expect(dashboardScopeFilters({ assignee: 'me' }, () => 'u-me')).toEqual(jasmine.objectContaining({ assignedToUserId: 'u-me' }));
      expect(dashboardScopeFilters({ assignee: 'me' }, noUser)).toBeNull();
    });

    it('reads the logged-in user only for "meus"', () => {
      const userId = jasmine.createSpy('userId').and.returnValue('u-me');
      dashboardScopeFilters({ sectorIds: ['s1'] }, userId);
      dashboardScopeFilters({ assignee: 'none' }, userId);
      expect(userId).not.toHaveBeenCalled();
    });
  });

  describe('sameDashboardScope', () => {
    it('compares field by field: keys in another order and sectors absent or empty are the same selection', () => {
      expect(sameDashboardScope({ sectorIds: ['s1'], priority: TicketPriority.High }, { priority: TicketPriority.High, sectorIds: ['s1'] })).toBeTrue();
      expect(sameDashboardScope({}, { sectorIds: [] })).toBeTrue();
    });

    it('any field that changes the tickets makes another selection', () => {
      const base: TicketDashboardScope = { sectorIds: ['s1'], priority: TicketPriority.High, assignee: 'me', from: '2026-10-01', to: '2026-10-28' };
      expect(sameDashboardScope(base, { ...base, sectorIds: ['s2'] })).toBeFalse();
      expect(sameDashboardScope(base, { ...base, priority: TicketPriority.Low })).toBeFalse();
      expect(sameDashboardScope(base, { ...base, assignee: 'none' })).toBeFalse();
      expect(sameDashboardScope(base, { ...base, assignee: undefined, assignedToUserId: 'u-ana' })).toBeFalse();
      expect(sameDashboardScope(base, { ...base, from: '2026-10-02' })).toBeFalse();
      expect(sameDashboardScope(base, { ...base, to: undefined })).toBeFalse();
    });
  });

  describe('the aggregate (TicketDashboardStore) and the Alertas de SLA (TicketSummaryStore) agree on the selection', () => {
    let dataService: jasmine.SpyObj<TicketDataService>;

    beforeEach(() => {
      dataService = jasmine.createSpyObj('TicketDataService', ['getOverview', 'getTimes', 'getVolume', 'getStatusCounts', 'getAll', 'getSlaSummary']);
      dataService.getOverview.and.returnValue(of(OVERVIEW));
      dataService.getTimes.and.returnValue(of({
        firstResponse: { averageMinutes: null, medianMinutes: null, sampleSize: 0 },
        resolution: { averageMinutes: null, medianMinutes: null, sampleSize: 0 },
        minimumSampleSize: 5
      }));
      dataService.getVolume.and.returnValue(of([]));
      dataService.getAll.and.returnValue(of({ items: [], page: 1, pageSize: 5, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false }));
      dataService.getSlaSummary.and.returnValue(of({ activeCount: 0, onTimeCount: 0, atRiskCount: 0, breachedCount: 0, serverNowUtc: '2026-11-06T12:00:00Z' }));

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: TicketDataService, useValue: dataService },
          { provide: SessionService, useValue: { userId: signal('u-me'), hasPermission: (code: string) => code === 'tickets:manage' } }
        ]
      });
    });

    /** Espera os resources dos dois Stores responderem. */
    const settle = () => TestBed.inject(ApplicationRef).whenStable();

    /** Aplica o mesmo recorte nos dois Stores, como o Início faz, e espera as buscas. */
    async function applyToBoth(scope: TicketDashboardScope): Promise<void> {
      TestBed.inject(TicketDashboardStore).setScope(scope);
      TestBed.inject(TicketSummaryStore).setCriticalScope(scope);
      await settle();
    }

    it('for the same selection, both send the same filters to the API: sectors, priority, assignee and opening period', async () => {
      const scopes: TicketDashboardScope[] = [
        { sectorIds: ['s1', 's2'], priority: TicketPriority.High, from: '2026-10-01', to: '2026-10-28' },
        { assignee: 'none', from: '2026-10-01' },
        { assignee: 'me', sectorIds: ['s3'] },
        { assignedToUserId: 'u-ana', to: '2026-10-28' },
        {}
      ];
      for (const scope of scopes) {
        dataService.getOverview.calls.reset();
        dataService.getAll.calls.reset();
        await applyToBoth(scope);
        const which = JSON.stringify(scope);

        // O agregado do período (o do período anterior, quando há, usa outras datas).
        const overview = dataService.getOverview.calls.allArgs().map(([filters]) => filters)
          .find(filters => filters.createdFrom === scope.from && filters.createdTo === scope.to);
        expect(overview).withContext(which).toBeDefined();
        const alerts = dataService.getAll.calls.allArgs().map(([filters]) => scopeOf(filters));
        expect(alerts.length).withContext(which).toBe(2);
        alerts.forEach(filters => expect(filters).withContext(which).toEqual(scopeOf(overview!)));
      }
    });

    it('a selection equal in meaning (keys in another order, sectors written as an empty list) redoes the requests in neither Store', async () => {
      await applyToBoth({ sectorIds: ['s1'], priority: TicketPriority.High });
      dataService.getOverview.calls.reset();
      dataService.getAll.calls.reset();

      await applyToBoth({ priority: TicketPriority.High, sectorIds: ['s1'] });
      await applyToBoth({ sectorIds: ['s1'], priority: TicketPriority.High, assignee: undefined });

      expect(dataService.getOverview).not.toHaveBeenCalled();
      expect(dataService.getAll).not.toHaveBeenCalled();

      await applyToBoth({});
      dataService.getOverview.calls.reset();
      dataService.getAll.calls.reset();
      await applyToBoth({ sectorIds: [] });

      expect(dataService.getOverview).not.toHaveBeenCalled();
      expect(dataService.getAll).not.toHaveBeenCalled();
    });
  });
});
