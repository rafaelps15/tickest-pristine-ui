import { TicketStatus, TicketStatusCounts, TicketVolumeGrouping, TicketVolumePoint } from '../tickets';
import { formatIsoDate, shiftIsoDate } from '../shared';
import { DASHBOARD_INSIGHT_RULES, DashboardInsightRules } from './dashboard-insight-rules';

/**
 * Estado de um widget do Início, decidido pelos sinais da fonte (nunca pelo texto da mensagem):
 * `unavailable` quando o back-end ainda não entrega a rota (flag desligada), `error` numa falha
 * real, `loading` sem nada pra mostrar ainda, `empty` com resposta sem dado e `ready` com dado.
 */
export type DashboardWidgetState = 'unavailable' | 'error' | 'loading' | 'empty' | 'ready';

/** Sinais de uma fonte de dados, como os stores expõem. */
export interface DashboardWidgetSource {
  /** A rota existe e pode ser pedida por quem está logado. */
  available: boolean;
  /** A última leitura falhou. */
  failed: boolean;
  /** Já há resposta (numa recarga, a anterior continua valendo). */
  hasValue: boolean;
  /** A resposta não tem nada a mostrar. */
  empty?: boolean;
}

/** Estado do widget a partir da fonte: indisponível > erro > com dado (vazio ou não) > carregando. */
export function widgetState(source: DashboardWidgetSource): DashboardWidgetState {
  if (!source.available) return 'unavailable';
  if (source.failed) return 'error';
  if (source.hasValue) return source.empty ? 'empty' : 'ready';
  return 'loading';
}

/** Grupo do status no Início: aberto, em andamento, resolvido ou fechado. */
export type DashboardStatusGroup = 'open' | 'inProgress' | 'resolved' | 'closed';

/** Rótulo de cada grupo, igual em cards, barra, legenda e tabela. */
export const DASHBOARD_STATUS_GROUP_LABELS: Record<DashboardStatusGroup, string> = {
  open: 'Abertos',
  inProgress: 'Em andamento',
  resolved: 'Resolvidos',
  closed: 'Fechados'
};

/**
 * Mapeamento confirmado (2026-10-28) entre os grupos do Início e os status do back-end — o
 * drill-down filtra a fila por ele. Cancelado fica fora: não é fila nem entrega, e só aparece como
 * "+ N cancelados" abaixo da barra. "Aguardando" (spec 029) não é status: o chamado continua no
 * grupo do status dele (em andamento, em geral).
 */
export const DASHBOARD_STATUS_GROUP_STATUS: Record<DashboardStatusGroup, TicketStatus> = {
  open: TicketStatus.Open,
  inProgress: TicketStatus.InProgress,
  resolved: TicketStatus.Resolved,
  closed: TicketStatus.Closed
};

/** Um pedaço da barra de composição. */
export interface DashboardStatusSegment {
  /** Grupo do status. */
  group: DashboardStatusGroup;
  /** Quantos chamados estão nele agora. */
  count: number;
  /** Fatia da barra em % inteiro (as fatias somam 100 quando há chamados). */
  percent: number;
}

/** Composição atual da empresa por grupo de status, com os cancelados à parte. */
export interface DashboardStatusComposition {
  /** As quatro fatias, na ordem do ciclo de vida. */
  segments: DashboardStatusSegment[];
  /** Chamados na barra (todos os status menos Cancelado). */
  inBar: number;
  /** Cancelados, fora da barra. */
  canceled: number;
  /** Total do servidor (`totalCount`) — inBar + canceled fecha com ele. */
  total: number;
}

/**
 * Composição atual a partir dos totais por status do servidor. Os percentuais são arredondados
 * pelo maior resto, pra somarem exatamente 100 (uma barra que soma 99% parece erro).
 */
export function statusComposition(counts: TicketStatusCounts): DashboardStatusComposition {
  const raw: [DashboardStatusGroup, number][] = [
    ['open', counts.openCount],
    ['inProgress', counts.inProgressCount],
    ['resolved', counts.resolvedCount],
    ['closed', counts.closedCount]
  ];
  const inBar = raw.reduce((sum, [, count]) => sum + count, 0);
  const exact = raw.map(([, count]) => (inBar > 0 ? (count * 100) / inBar : 0));
  const percents = exact.map(Math.floor);
  let missing = inBar > 0 ? 100 - percents.reduce((sum, p) => sum + p, 0) : 0;
  const byRemainder = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (missing <= 0) break;
    percents[index]++;
    missing--;
  }
  return {
    segments: raw.map(([group, count], index) => ({ group, count, percent: percents[index] })),
    inBar,
    canceled: counts.canceledCount,
    total: counts.totalCount
  };
}

/** Número inteiro em pt-BR com separador de milhar ("1.240"). */
const FULL_NUMBER = new Intl.NumberFormat('pt-BR');

/** Número compacto em pt-BR ("1,2 mil", "3,4 mi"). */
const COMPACT_NUMBER = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** Contagem pra exibir num card: completa até 9.999 ("1.240"), compacta daí pra cima ("12,3 mil"). */
export function formatCount(value: number): string {
  return Math.abs(value) >= 10_000 ? COMPACT_NUMBER.format(value) : FULL_NUMBER.format(value);
}

/** Contagem completa, pra leitor de tela e tooltip ("12.345"). */
export function formatFullCount(value: number): string {
  return FULL_NUMBER.format(value);
}

/** Contagem compacta, pros eixos do gráfico ("1,2 mil"). */
export function formatCompactCount(value: number): string {
  return COMPACT_NUMBER.format(value);
}

/**
 * Idade dos números em texto: "Atualizado agora" no primeiro minuto, "Atualizado há N min" até uma
 * hora e "Atualizado às HH:mm" depois. Null antes da primeira carga.
 */
export function freshnessLabel(updatedAtMs: number | null, nowMs: number): string | null {
  if (updatedAtMs === null) return null;
  const minutes = Math.floor(Math.max(0, nowMs - updatedAtMs) / 60_000);
  if (minutes < 1) return 'Atualizado agora';
  if (minutes < 60) return `Atualizado há ${minutes} min`;
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(updatedAtMs);
  return `Atualizado às ${time}`;
}

/**
 * Aviso de visibilidade num número da empresa: quem não atende a fila só vê os próprios chamados na
 * lista, então o drill-down mostra menos do que o card conta. Null quando não há diferença a explicar.
 */
export function accessNote(own: number | null, company: number): string | null {
  if (own === null || own >= company) return null;
  if (own === 0) return company === 1 ? 'Você não tem acesso a este chamado' : `Você não tem acesso a nenhum destes ${formatFullCount(company)} chamados`;
  return `Você tem acesso a ${formatFullCount(own)} dos ${formatFullCount(company)} chamados`;
}

/**
 * Dias que um período do gráfico cobre (`aaaa-mm-dd`, inclusivo, horário de Brasília — o início já
 * vem do back-end assim): o próprio dia, a semana de segunda a domingo ou o mês inteiro.
 */
export function bucketRange(periodStart: string, groupBy: TicketVolumeGrouping): { from: string; to: string } {
  if (groupBy === 'Day') return { from: periodStart, to: periodStart };
  if (groupBy === 'Week') return { from: periodStart, to: shiftIsoDate(periodStart, 6) };
  const [year, month] = periodStart.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: periodStart, to: `${periodStart.slice(0, 8)}${String(lastDay).padStart(2, '0')}` };
}

/** Nomes curtos dos meses em português, pros rótulos do gráfico quando o agrupamento é mensal. */
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Rótulo curto do período no eixo: dd/mm pra dia e semana (a semana começa na segunda), "mês/aa" pra mês. */
export function bucketShortLabel(periodStart: string, groupBy: TicketVolumeGrouping): string {
  const [year, month, day] = periodStart.split('-');
  return groupBy === 'Month' ? `${MONTH_LABELS[Number(month) - 1]}/${year.slice(2)}` : `${day}/${month}`;
}

/** Rótulo completo do período, pro tooltip e a tabela ("Semana de 20/10/2026 a 26/10/2026"). */
export function bucketLongLabel(periodStart: string, groupBy: TicketVolumeGrouping): string {
  const range = bucketRange(periodStart, groupBy);
  if (groupBy === 'Day') return `${WEEKDAY_LABELS[weekdayOf(periodStart)]}, ${formatIsoDate(range.from)}`;
  if (groupBy === 'Week') return `Semana de ${formatIsoDate(range.from)} a ${formatIsoDate(range.to)}`;
  const [year, month] = periodStart.split('-');
  return `${MONTH_LABELS[Number(month) - 1]}/${year}`;
}

/** Nomes dos dias da semana, de domingo (0) a sábado (6). */
const WEEKDAY_LABELS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Dia da semana (0 = domingo) de uma data local `aaaa-mm-dd`, sem passar pelo fuso da máquina. */
function weekdayOf(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * Posições dos sábados e domingos no fluxo, pro sombreado do gráfico — só no agrupamento por dia
 * (semana e mês já cobrem fins de semana dentro de si). A data é a local de São Paulo, como o
 * back-end agrupa.
 */
export function weekendIndexes(points: TicketVolumePoint[], groupBy: TicketVolumeGrouping): number[] {
  if (groupBy !== 'Day') return [];
  return points.flatMap((point, index) => {
    const weekday = weekdayOf(point.periodStart);
    return weekday === 0 || weekday === 6 ? [index] : [];
  });
}

/** Unidade da média, por agrupamento ("por dia"). */
export const AVERAGE_UNIT_LABELS: Record<TicketVolumeGrouping, string> = { Day: 'por dia', Week: 'por semana', Month: 'por mês' };

/**
 * Média de chamados criados por período, só sobre os períodos completos: o último (hoje, esta
 * semana, este mês) ainda está pela metade e puxaria a média pra baixo. Null com menos de dois
 * períodos completos — uma média de um ponto só não diz nada.
 */
export function periodAverage(points: TicketVolumePoint[]): number | null {
  const complete = points.slice(0, -1);
  if (complete.length < 2) return null;
  return complete.reduce((sum, point) => sum + point.count, 0) / complete.length;
}

/** Média com uma casa decimal em pt-BR ("4,3"), inteira quando não tem fração ("5"). */
export function formatAverage(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
}

/** Janelas comparadas pela frase de destaque, por agrupamento. */
interface InsightWindows {
  /** Pontos da janela atual. */
  current: TicketVolumePoint[];
  /** Pontos da janela anterior, de mesmo tamanho. */
  previous: TicketVolumePoint[];
  /** Como a frase chama a janela atual ("nos últimos 7 dias"). */
  currentLabel: string;
  /** Como a frase chama a anterior ("nos 7 dias anteriores"). */
  previousLabel: string;
}

/**
 * Escolhe as janelas, sempre com períodos completos (o atual — hoje, esta semana, este mês — ainda
 * está pela metade e puxaria a comparação pra baixo): por dia, os 7 dias até ontem contra os 7
 * anteriores; por semana e por mês, o último período completo contra o anterior. Null quando não
 * há pontos suficientes.
 */
function insightWindows(points: TicketVolumePoint[], groupBy: TicketVolumeGrouping): InsightWindows | null {
  if (groupBy === 'Day') {
    if (points.length < 15) return null;
    return {
      current: points.slice(-8, -1),
      previous: points.slice(-15, -8),
      currentLabel: 'nos 7 dias até ontem',
      previousLabel: 'nos 7 anteriores'
    };
  }
  if (points.length < 3) return null;
  const week = groupBy === 'Week';
  return {
    current: points.slice(-2, -1),
    previous: points.slice(-3, -2),
    currentLabel: week ? 'na semana passada' : 'no mês passado',
    previousLabel: week ? 'na anterior' : 'no anterior'
  };
}

/** Soma uma série dos pontos. */
function total(points: TicketVolumePoint[], pick: (point: TicketVolumePoint) => number): number {
  return points.reduce((sum, point) => sum + pick(point), 0);
}

/**
 * Frase de destaque acima do gráfico, por regras explícitas e testáveis (limiares em
 * {@link DASHBOARD_INSIGHT_RULES}). Hoje roda só a regra da **entrada de chamados** (criados na
 * janela contra a anterior), que não afirma nada sobre a fila. A regra de **fila** (entradas contra
 * resoluções) só roda com `withResolved` — a flag `volumeResolved` ligada (spec 028) e os resolvidos
 * na resposta. Abaixo da amostra mínima, ou sem pontos suficientes, devolve null — nenhuma frase é
 * melhor que uma vaga.
 */
export function volumeInsight(points: TicketVolumePoint[], groupBy: TicketVolumeGrouping, withResolved = false, rules: DashboardInsightRules = DASHBOARD_INSIGHT_RULES): string | null {
  const windows = insightWindows(points, groupBy);
  if (!windows) return null;
  const created = total(windows.current, point => point.count);

  if (withResolved && points.every(point => point.resolvedCount !== undefined)) {
    const resolved = total(windows.current, point => point.resolvedCount ?? 0);
    if (created + resolved < rules.minimumSample) return null;
    const margin = 1 + rules.balancePercent / 100;
    if (resolved > created * margin) return `Mais chamados resolvidos do que abertos ${windows.currentLabel}.`;
    if (created > resolved * margin) return `Entraram mais chamados do que foram resolvidos ${windows.currentLabel}.`;
    return `Fila estável: tantos chamados resolvidos quanto abertos ${windows.currentLabel}.`;
  }

  const previous = total(windows.previous, point => point.count);
  if (previous < rules.minimumSample) return null;
  const change = Math.round(((created - previous) * 100) / previous);
  if (Math.abs(change) < rules.changePercent) return `A entrada de chamados ficou estável ${windows.currentLabel}.`;
  // O número absoluto vem antes do percentual: "+125%" sobre uma base pequena assusta mais do que informa.
  const diff = Math.abs(created - previous);
  const noun = diff === 1 ? 'chamado' : 'chamados';
  const sign = change > 0 ? '+' : '−';
  return `${formatFullCount(diff)} ${noun} a ${change > 0 ? 'mais' : 'menos'} (${sign}${Math.abs(change)}%) ${windows.currentLabel} que ${windows.previousLabel}.`;
}
