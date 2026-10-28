import { ParamMap, Params } from '@angular/router';
import { TicketDashboardAssignee, TicketDashboardScope, TicketPriority } from '../tickets';

/** Prioridades aceitas em `?priority=` (os números do enum do back-end). */
const PRIORITIES: TicketPriority[] = [TicketPriority.Low, TicketPriority.Medium, TicketPriority.High, TicketPriority.Urgent];

/** Valores aceitos em `?assignee=`. */
const ASSIGNEES: TicketDashboardAssignee[] = ['me', 'none'];

/**
 * Lê os filtros do Início a partir da URL — a URL é a fonte da verdade (link compartilhável e
 * "voltar" do navegador). Valor inválido é ignorado, nunca vira um filtro inventado.
 * Parâmetros: `sectorId` (GUID), `priority` (1–4), `assignee` (`me` | `none`).
 */
export function parseDashboardFilters(params: ParamMap): TicketDashboardScope {
  const priority = Number(params.get('priority'));
  const assignee = params.get('assignee') as TicketDashboardAssignee | null;
  return {
    sectorId: params.get('sectorId') || undefined,
    priority: PRIORITIES.includes(priority) ? priority : undefined,
    assignee: assignee && ASSIGNEES.includes(assignee) ? assignee : undefined
  };
}

/** Filtros em query params — `null` remove o parâmetro, pra URL não carregar filtros vazios. */
export function dashboardFiltersToQueryParams(filters: TicketDashboardScope): Params {
  return {
    sectorId: filters.sectorId ?? null,
    priority: filters.priority ?? null,
    assignee: filters.assignee ?? null
  };
}

/** Se há algum filtro aplicado (mostra os chips e o "Limpar filtros"). */
export function hasDashboardFilters(filters: TicketDashboardScope): boolean {
  return filters.sectorId !== undefined || filters.priority !== undefined || filters.assignee !== undefined;
}

/**
 * Leva o recorte do Início pro Monitor (drill-down): setor, prioridade e responsável viram os
 * parâmetros que o Monitor já aceita, e `extra` acrescenta o que o indicador clicado representa
 * (status, situação do SLA…). `extra` vence o recorte quando os dois falam da mesma coisa.
 */
export function toMonitorQueryParams(filters: TicketDashboardScope, extra: Params = {}): Params {
  const params: Params = {};
  if (filters.sectorId) params['sectorId'] = filters.sectorId;
  if (filters.priority !== undefined) params['priority'] = filters.priority;
  if (filters.assignee === 'me') params['assignedToMe'] = 'true';
  if (filters.assignee === 'none') params['unassignedOnly'] = 'true';
  const merged = { ...params, ...extra };
  // "Sem responsável" e "atribuídos a mim" se excluem no Monitor.
  if (merged['unassignedOnly'] === 'true') delete merged['assignedToMe'];
  return merged;
}
