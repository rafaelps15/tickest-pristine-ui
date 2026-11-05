import { convertToParamMap } from '@angular/router';
import { Department } from '../departments';
import { TicketPriority, TicketSlaStatus } from '../tickets';
import {
  addDays, dashboardFiltersToQueryParams, dashboardPeriodRange, hasDashboardFilters,
  parseDashboardFilters, resolveDashboardScope, toMonitorQueryParams
} from './dashboard-filters';
import { isIsoDate } from '../shared';

/** Departamento de exemplo com dois setores. */
const DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'TI', description: '', responsibleUserId: null, responsibleUserName: null, sectors: [{ id: 's1', name: 'Helpdesk', description: null }, { id: 's2', name: 'Infra', description: null }] },
  { id: 'd2', name: 'Vazio', description: '', responsibleUserId: null, responsibleUserName: null, sectors: [] }
];

describe('dashboard-filters', () => {
  it('reads department, sector, priority, assignee and preset period from the URL', () => {
    const filters = parseDashboardFilters(convertToParamMap({ departmentId: 'd1', sectorId: 's1', priority: '4', assignee: 'me', period: '30d' }));

    expect(filters).toEqual({
      departmentId: 'd1', sectorId: 's1', priority: TicketPriority.Urgent, assignee: 'me',
      assignedToUserId: undefined, period: '30d', from: undefined, to: undefined
    });
  });

  it('reads a person as assignee, and "meus"/"sem responsável" win over the person', () => {
    expect(parseDashboardFilters(convertToParamMap({ assignedToUserId: 'u1' })).assignedToUserId).toBe('u1');
    expect(parseDashboardFilters(convertToParamMap({ assignee: 'none', assignedToUserId: 'u1' })).assignedToUserId).toBeUndefined();
  });

  it('reads the custom period only with real dates and a start before the end', () => {
    expect(parseDashboardFilters(convertToParamMap({ from: '2026-10-01', to: '2026-10-28' }))).toEqual(jasmine.objectContaining({ from: '2026-10-01', to: '2026-10-28' }));
    expect(parseDashboardFilters(convertToParamMap({ from: '2026-10-28', to: '2026-10-01' }))).toEqual(jasmine.objectContaining({ from: undefined, to: undefined }));
    expect(parseDashboardFilters(convertToParamMap({ from: '2026-02-30' })).from).toBeUndefined();
    // Período pronto vence o personalizado.
    expect(parseDashboardFilters(convertToParamMap({ period: '7d', from: '2026-10-01' })).from).toBeUndefined();
  });

  it('ignores invalid values instead of inventing a filter', () => {
    const filters = parseDashboardFilters(convertToParamMap({ sectorId: '', priority: '9', assignee: 'todos', period: '1y' }));

    expect(hasDashboardFilters(filters)).toBeFalse();
  });

  it('writes the filters to the URL and removes the empty ones (null)', () => {
    expect(dashboardFiltersToQueryParams({ priority: TicketPriority.High, period: '7d' })).toEqual({
      departmentId: null, sectorId: null, priority: 3, assignee: null, assignedToUserId: null, period: '7d', from: null, to: null
    });
  });

  it('computes dates in the API format', () => {
    expect(isIsoDate('2026-10-28')).toBeTrue();
    expect(isIsoDate('28/10/2026')).toBeFalse();
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('the preset period counts today: last 7 days = today and the 6 before', () => {
    expect(dashboardPeriodRange({ period: '7d' }, '2026-10-28')).toEqual({ from: '2026-10-22', to: '2026-10-28' });
    expect(dashboardPeriodRange({ from: '2026-10-01' }, '2026-10-28')).toEqual({ from: '2026-10-01', to: undefined });
    expect(dashboardPeriodRange({}, '2026-10-28')).toBeNull();
  });

  it('translates the department into its sectors, and the sector wins over the department', () => {
    expect(resolveDashboardScope({ departmentId: 'd1' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toEqual(['s1', 's2']);
    expect(resolveDashboardScope({ departmentId: 'd1', sectorId: 's2' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toEqual(['s2']);
  });

  it('waits for the departments to load, and ignores an unknown department or one without sectors', () => {
    expect(resolveDashboardScope({ departmentId: 'd1' }, [], true, '2026-10-28')).toBeNull();
    expect(resolveDashboardScope({ departmentId: 'x' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toBeUndefined();
    expect(resolveDashboardScope({ departmentId: 'd2' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toBeUndefined();
  });

  it('takes the selection to the Monitor, with repeated sectors, opening period and what the indicator adds', () => {
    const params = toMonitorQueryParams(
      { sectorIds: ['s1', 's2'], priority: TicketPriority.High, assignee: 'me', from: '2026-10-01', to: '2026-10-28' },
      { slaStatus: TicketSlaStatus.Breached });

    expect(params).toEqual({ status: 'all', sectorId: ['s1', 's2'], priority: 3, assignedToMe: 'true', createdFrom: '2026-10-01', createdTo: '2026-10-28', slaStatus: 3 });
  });

  it('a sector goes as a plain value, and a person goes by id', () => {
    expect(toMonitorQueryParams({ sectorIds: ['s1'], assignedToUserId: 'u1' })).toEqual({ status: 'all', sectorId: 's1', assignedToUserId: 'u1' });
  });

  it('in the drill-down, the indicator wins over the selection and "sem responsável" excludes any assignee', () => {
    expect(toMonitorQueryParams({ priority: TicketPriority.Low, assignee: 'me' }, { priority: TicketPriority.Urgent, unassignedOnly: 'true' }))
      .toEqual({ status: 'all', priority: 4, unassignedOnly: 'true' });
    expect(toMonitorQueryParams({ assignedToUserId: 'u1' }, { unassignedOnly: 'true' })).toEqual({ status: 'all', unassignedOnly: 'true' });
  });
});
