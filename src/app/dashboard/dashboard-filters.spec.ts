import { convertToParamMap } from '@angular/router';
import { TicketPriority, TicketSlaStatus } from '../tickets';
import { dashboardFiltersToQueryParams, hasDashboardFilters, parseDashboardFilters, toMonitorQueryParams } from './dashboard-filters';

describe('dashboard-filters', () => {
  it('lê setor, prioridade e responsável da URL', () => {
    const filters = parseDashboardFilters(convertToParamMap({ sectorId: 's1', priority: '4', assignee: 'me' }));

    expect(filters).toEqual({ sectorId: 's1', priority: TicketPriority.Urgent, assignee: 'me' });
  });

  it('ignora valores inválidos em vez de inventar um filtro', () => {
    const filters = parseDashboardFilters(convertToParamMap({ sectorId: '', priority: '9', assignee: 'todos' }));

    expect(filters).toEqual({ sectorId: undefined, priority: undefined, assignee: undefined });
    expect(hasDashboardFilters(filters)).toBeFalse();
  });

  it('grava os filtros na URL e remove os vazios (null)', () => {
    expect(dashboardFiltersToQueryParams({ priority: TicketPriority.High })).toEqual({ sectorId: null, priority: 3, assignee: null });
    expect(dashboardFiltersToQueryParams({})).toEqual({ sectorId: null, priority: null, assignee: null });
  });

  it('leva o recorte pro Monitor, com o que o indicador acrescenta', () => {
    const params = toMonitorQueryParams({ sectorId: 's1', priority: TicketPriority.High, assignee: 'me' }, { slaStatus: TicketSlaStatus.Breached });

    expect(params).toEqual({ sectorId: 's1', priority: 3, assignedToMe: 'true', slaStatus: 3 });
  });

  it('no drill-down, o indicador vence o recorte e "sem responsável" exclui "atribuídos a mim"', () => {
    const params = toMonitorQueryParams({ priority: TicketPriority.Low, assignee: 'me' }, { priority: TicketPriority.Urgent, unassignedOnly: 'true' });

    expect(params).toEqual({ priority: 4, unassignedOnly: 'true' });
  });

  it('sem recorte, o drill-down leva só o que o indicador representa', () => {
    expect(toMonitorQueryParams({}, { status: 'active' })).toEqual({ status: 'active' });
    expect(toMonitorQueryParams({ assignee: 'none' })).toEqual({ unassignedOnly: 'true' });
  });
});
