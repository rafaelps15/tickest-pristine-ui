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
  { id: 'd1', name: 'TI', description: '', responsibleUserName: null, sectors: [{ id: 's1', name: 'Helpdesk', description: null }, { id: 's2', name: 'Infra', description: null }] },
  { id: 'd2', name: 'Vazio', description: '', responsibleUserName: null, sectors: [] }
];

describe('dashboard-filters', () => {
  it('lê departamento, setor, prioridade, responsável e período pronto da URL', () => {
    const filters = parseDashboardFilters(convertToParamMap({ departmentId: 'd1', sectorId: 's1', priority: '4', assignee: 'me', period: '30d' }));

    expect(filters).toEqual({
      departmentId: 'd1', sectorId: 's1', priority: TicketPriority.Urgent, assignee: 'me',
      assignedToUserId: undefined, period: '30d', from: undefined, to: undefined
    });
  });

  it('lê uma pessoa como responsável, e "meus"/"sem responsável" vencem a pessoa', () => {
    expect(parseDashboardFilters(convertToParamMap({ assignedToUserId: 'u1' })).assignedToUserId).toBe('u1');
    expect(parseDashboardFilters(convertToParamMap({ assignee: 'none', assignedToUserId: 'u1' })).assignedToUserId).toBeUndefined();
  });

  it('lê o período personalizado só com datas reais e início antes do fim', () => {
    expect(parseDashboardFilters(convertToParamMap({ from: '2026-10-01', to: '2026-10-28' }))).toEqual(jasmine.objectContaining({ from: '2026-10-01', to: '2026-10-28' }));
    expect(parseDashboardFilters(convertToParamMap({ from: '2026-10-28', to: '2026-10-01' }))).toEqual(jasmine.objectContaining({ from: undefined, to: undefined }));
    expect(parseDashboardFilters(convertToParamMap({ from: '2026-02-30' })).from).toBeUndefined();
    // Período pronto vence o personalizado.
    expect(parseDashboardFilters(convertToParamMap({ period: '7d', from: '2026-10-01' })).from).toBeUndefined();
  });

  it('ignora valores inválidos em vez de inventar um filtro', () => {
    const filters = parseDashboardFilters(convertToParamMap({ sectorId: '', priority: '9', assignee: 'todos', period: '1y' }));

    expect(hasDashboardFilters(filters)).toBeFalse();
  });

  it('grava os filtros na URL e remove os vazios (null)', () => {
    expect(dashboardFiltersToQueryParams({ priority: TicketPriority.High, period: '7d' })).toEqual({
      departmentId: null, sectorId: null, priority: 3, assignee: null, assignedToUserId: null, period: '7d', from: null, to: null
    });
  });

  it('calcula datas no formato da API', () => {
    expect(isIsoDate('2026-10-28')).toBeTrue();
    expect(isIsoDate('28/10/2026')).toBeFalse();
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('o período pronto conta hoje: últimos 7 dias = hoje e os 6 anteriores', () => {
    expect(dashboardPeriodRange({ period: '7d' }, '2026-10-28')).toEqual({ from: '2026-10-22', to: '2026-10-28' });
    expect(dashboardPeriodRange({ from: '2026-10-01' }, '2026-10-28')).toEqual({ from: '2026-10-01', to: undefined });
    expect(dashboardPeriodRange({}, '2026-10-28')).toBeNull();
  });

  it('traduz o departamento nos setores dele, e o setor vence o departamento', () => {
    expect(resolveDashboardScope({ departmentId: 'd1' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toEqual(['s1', 's2']);
    expect(resolveDashboardScope({ departmentId: 'd1', sectorId: 's2' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toEqual(['s2']);
  });

  it('espera os departamentos carregarem, e ignora departamento desconhecido ou sem setores', () => {
    expect(resolveDashboardScope({ departmentId: 'd1' }, [], true, '2026-10-28')).toBeNull();
    expect(resolveDashboardScope({ departmentId: 'x' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toBeUndefined();
    expect(resolveDashboardScope({ departmentId: 'd2' }, DEPARTMENTS, false, '2026-10-28')?.sectorIds).toBeUndefined();
  });

  it('leva o recorte pro Monitor, com setores repetidos, período de abertura e o que o indicador acrescenta', () => {
    const params = toMonitorQueryParams(
      { sectorIds: ['s1', 's2'], priority: TicketPriority.High, assignee: 'me', from: '2026-10-01', to: '2026-10-28' },
      { slaStatus: TicketSlaStatus.Breached });

    expect(params).toEqual({ status: 'all', sectorId: ['s1', 's2'], priority: 3, assignedToMe: 'true', createdFrom: '2026-10-01', createdTo: '2026-10-28', slaStatus: 3 });
  });

  it('um setor vai como valor simples, e uma pessoa vai pelo id', () => {
    expect(toMonitorQueryParams({ sectorIds: ['s1'], assignedToUserId: 'u1' })).toEqual({ status: 'all', sectorId: 's1', assignedToUserId: 'u1' });
  });

  it('no drill-down, o indicador vence o recorte e "sem responsável" exclui qualquer responsável', () => {
    expect(toMonitorQueryParams({ priority: TicketPriority.Low, assignee: 'me' }, { priority: TicketPriority.Urgent, unassignedOnly: 'true' }))
      .toEqual({ status: 'all', priority: 4, unassignedOnly: 'true' });
    expect(toMonitorQueryParams({ assignedToUserId: 'u1' }, { unassignedOnly: 'true' })).toEqual({ status: 'all', unassignedOnly: 'true' });
  });
});
