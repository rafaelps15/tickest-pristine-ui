import { ParamMap, Params } from '@angular/router';
import { Department } from '../departments';
import { TicketAssignee, TicketDashboardAssignee, TicketDashboardScope, TicketPriority, TICKET_PRIORITY_LABELS } from '../tickets';
import { formatIsoDate, isIsoDate, shiftIsoDate } from '../shared';

/** Períodos prontos do Início: últimos 7, 30 ou 90 dias, contando hoje. */
export type DashboardPeriodPreset = '7d' | '30d' | '90d';

/** Quantos dias cada período pronto cobre. */
export const DASHBOARD_PERIOD_DAYS: Record<DashboardPeriodPreset, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Rótulo de cada período pronto. */
export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriodPreset, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias'
};

/**
 * Filtros do Início como estão na URL. Departamento e período ficam como o usuário escolheu
 * ("Últimos 30 dias" continua valendo amanhã); {@link resolveDashboardScope} traduz pro recorte
 * que a API aceita (setores e datas).
 */
export interface DashboardFilters {
  /** Departamento: vale como todos os setores dele. */
  departmentId?: string;
  /** Um setor; vence o departamento. */
  sectorId?: string;
  /** Uma prioridade. */
  priority?: TicketPriority;
  /** Só meus, ou só sem responsável; exclusivo com `assignedToUserId`. */
  assignee?: TicketDashboardAssignee;
  /** Só os chamados desta pessoa. */
  assignedToUserId?: string;
  /** Período pronto; exclusivo com `from`/`to`. */
  period?: DashboardPeriodPreset;
  /** Início do período personalizado (`aaaa-mm-dd`). */
  from?: string;
  /** Fim do período personalizado (`aaaa-mm-dd`). */
  to?: string;
}

/** Prioridades aceitas em `?priority=` (os números do enum do back-end). */
const PRIORITIES: TicketPriority[] = [TicketPriority.Low, TicketPriority.Medium, TicketPriority.High, TicketPriority.Urgent];

/** Valores aceitos em `?assignee=`. */
const ASSIGNEES: TicketDashboardAssignee[] = ['me', 'none'];

/** Soma (ou subtrai) dias de uma data `aaaa-mm-dd` (o mesmo cálculo do shared, com o nome que a tela usa). */
export const addDays = shiftIsoDate;

/**
 * Lê os filtros do Início a partir da URL — a URL é a fonte da verdade (link compartilhável e
 * "voltar" do navegador). Valor inválido é ignorado, nunca vira um filtro inventado.
 * Parâmetros: `departmentId`, `sectorId`, `priority` (1–4), `assignee` (`me` | `none`),
 * `assignedToUserId`, `period` (`7d` | `30d` | `90d`) ou `from`/`to` (`aaaa-mm-dd`, início ≤ fim).
 */
export function parseDashboardFilters(params: ParamMap): DashboardFilters {
  const priority = Number(params.get('priority'));
  const assignee = params.get('assignee') as TicketDashboardAssignee | null;
  const validAssignee = assignee && ASSIGNEES.includes(assignee) ? assignee : undefined;
  const period = params.get('period') as DashboardPeriodPreset | null;
  const validPeriod = period && period in DASHBOARD_PERIOD_DAYS ? period : undefined;
  const from = params.get('from');
  const to = params.get('to');
  const customValid = !validPeriod && (isIsoDate(from) || isIsoDate(to))
    && !(isIsoDate(from) && isIsoDate(to) && from > to);
  return {
    departmentId: params.get('departmentId') || undefined,
    sectorId: params.get('sectorId') || undefined,
    priority: PRIORITIES.includes(priority) ? priority : undefined,
    assignee: validAssignee,
    assignedToUserId: validAssignee ? undefined : params.get('assignedToUserId') || undefined,
    period: validPeriod,
    from: customValid && isIsoDate(from) ? from : undefined,
    to: customValid && isIsoDate(to) ? to : undefined
  };
}

/** Filtros em query params — `null` remove o parâmetro, pra URL não carregar filtros vazios. */
export function dashboardFiltersToQueryParams(filters: DashboardFilters): Params {
  return {
    departmentId: filters.departmentId ?? null,
    sectorId: filters.sectorId ?? null,
    priority: filters.priority ?? null,
    assignee: filters.assignee ?? null,
    assignedToUserId: filters.assignedToUserId ?? null,
    period: filters.period ?? null,
    from: filters.from ?? null,
    to: filters.to ?? null
  };
}

/** Se há algum filtro aplicado (mostra os chips e o "Limpar filtros"). */
export function hasDashboardFilters(filters: DashboardFilters): boolean {
  return Object.values(filters).some(value => value !== undefined);
}

/** Intervalo de datas do período escolhido (pronto ou personalizado), ou null sem período. */
export function dashboardPeriodRange(filters: DashboardFilters, today: string): { from?: string; to?: string } | null {
  if (filters.period) return { from: addDays(today, 1 - DASHBOARD_PERIOD_DAYS[filters.period]), to: today };
  if (filters.from || filters.to) return { from: filters.from, to: filters.to };
  return null;
}

/**
 * Traduz os filtros da URL pro recorte da API: o setor vence o departamento; o departamento vira
 * os setores dele; o período vira datas. Devolve null enquanto um departamento da URL ainda não
 * pode ser traduzido (departamentos carregando) — melhor esperar que contar a empresa toda.
 * Departamento desconhecido ou sem setores é ignorado.
 */
export function resolveDashboardScope(filters: DashboardFilters, departments: Department[], departmentsLoading: boolean, today: string): TicketDashboardScope | null {
  let sectorIds: string[] | undefined;
  if (filters.sectorId) {
    sectorIds = [filters.sectorId];
  } else if (filters.departmentId) {
    const department = departments.find(d => d.id === filters.departmentId);
    if (!department && departmentsLoading) return null;
    sectorIds = department?.sectors.length ? department.sectors.map(s => s.id) : undefined;
  }
  const range = dashboardPeriodRange(filters, today);
  return {
    sectorIds,
    priority: filters.priority,
    assignee: filters.assignee,
    assignedToUserId: filters.assignedToUserId,
    from: range?.from,
    to: range?.to
  };
}

/**
 * Leva o recorte do Início pro Monitor (drill-down): setores (repetidos), prioridade,
 * responsável e período de abertura viram os parâmetros que o Monitor aceita, e `extra`
 * acrescenta o que o indicador clicado representa (status, situação do SLA…). `extra` vence o
 * recorte quando os dois falam da mesma coisa. Sem status no `extra`, vai `status=all`.
 */
export function toMonitorQueryParams(scope: TicketDashboardScope, extra: Params = {}): Params {
  const params: Params = {};
  if (scope.sectorIds?.length) params['sectorId'] = scope.sectorIds.length === 1 ? scope.sectorIds[0] : [...scope.sectorIds];
  if (scope.priority !== undefined) params['priority'] = scope.priority;
  if (scope.assignee === 'me') params['assignedToMe'] = 'true';
  if (scope.assignee === 'none') params['unassignedOnly'] = 'true';
  if (scope.assignedToUserId) params['assignedToUserId'] = scope.assignedToUserId;
  if (scope.from) params['createdFrom'] = scope.from;
  if (scope.to) params['createdTo'] = scope.to;
  // O Monitor abre nos ativos quando o link não diz o status: um card sem status (Total, Cumpridos…)
  // pede "todos os status" explicitamente, pra mostrar o mesmo que conta.
  const merged: Params = { status: 'all', ...params, ...extra };
  // "Sem responsável" exclui qualquer responsável no Monitor.
  if (merged['unassignedOnly'] === 'true') {
    delete merged['assignedToMe'];
    delete merged['assignedToUserId'];
  }
  return merged;
}

/** Um filtro ativo, mostrado como chip removível (barra) ou como texto (linha "Filtros aplicados"). */
export interface DashboardFilterChip {
  /** Identificador do filtro. */
  key: string;
  /** Texto do filtro ("Setor: Helpdesk"). */
  label: string;
  /** Troca que remove o filtro. */
  removal: Partial<DashboardFilters>;
}

/** Filtros ativos em texto, na ordem da barra, com os nomes de departamento, setor e pessoa resolvidos. */
export function dashboardFilterChips(filters: DashboardFilters, departments: Department[], assignees: TicketAssignee[]): DashboardFilterChip[] {
  const chips: DashboardFilterChip[] = [];
  if (filters.period) {
    chips.push({ key: 'period', label: DASHBOARD_PERIOD_LABELS[filters.period], removal: { period: undefined } });
  } else if (filters.from || filters.to) {
    const label = filters.from && filters.to
      ? `De ${formatIsoDate(filters.from)} a ${formatIsoDate(filters.to)}`
      : filters.from ? `Desde ${formatIsoDate(filters.from)}` : `Até ${formatIsoDate(filters.to as string)}`;
    chips.push({ key: 'custom', label, removal: { from: undefined, to: undefined } });
  }
  if (filters.departmentId) {
    // Departamento que não está na lista (id inválido ou lista que falhou) não recorta nada: o chip diz isso.
    const department = departments.find(d => d.id === filters.departmentId);
    const label = department ? `Departamento: ${department.name}` : 'Departamento não encontrado (ignorado)';
    chips.push({ key: 'department', label, removal: { departmentId: undefined } });
  }
  if (filters.sectorId) {
    const sector = departments.flatMap(d => d.sectors).find(s => s.id === filters.sectorId);
    chips.push({ key: 'sector', label: `Setor: ${sector?.name ?? 'selecionado'}`, removal: { sectorId: undefined } });
  }
  if (filters.priority !== undefined) {
    chips.push({ key: 'priority', label: `Prioridade: ${TICKET_PRIORITY_LABELS[filters.priority]}`, removal: { priority: undefined } });
  }
  if (filters.assignee === 'me') {
    chips.push({ key: 'assignee', label: 'Atribuídos a mim', removal: { assignee: undefined } });
  } else if (filters.assignee === 'none') {
    chips.push({ key: 'assignee', label: 'Sem responsável', removal: { assignee: undefined } });
  } else if (filters.assignedToUserId) {
    const person = assignees.find(a => a.id === filters.assignedToUserId);
    chips.push({ key: 'assignee', label: `Responsável: ${person?.fullName ?? 'selecionado'}`, removal: { assignedToUserId: undefined } });
  }
  return chips;
}
