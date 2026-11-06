import { TicketStatus, TicketVolumePoint } from '../tickets';
import { DASHBOARD_INSIGHT_RULES } from './dashboard-insight-rules';
import { DASHBOARD_STATUS_GROUP_STATUS, accessNote, bucketLongLabel, bucketRange, bucketShortLabel, formatAverage, formatCompactCount, formatCount, freshnessLabel, periodAverage, statusComposition, volumeInsight, weekendIndexes, widgetState } from './dashboard-overview';

/** Pontos diários com as contagens dadas, do mais antigo pro mais novo. */
function days(counts: number[], resolved?: number[]): TicketVolumePoint[] {
  return counts.map((count, i) => ({
    periodStart: `2026-10-${String(i + 1).padStart(2, '0')}`,
    count,
    ...(resolved ? { resolvedCount: resolved[i] } : {})
  }));
}

describe('dashboard-overview', () => {
  describe('widgetState', () => {
    it('a failed read is an error', () => {
      expect(widgetState({ failed: true, hasValue: false })).toBe('error');
    });

    it('with a response: empty or ready; on a reload, the previous response remains valid', () => {
      expect(widgetState({ failed: false, hasValue: true, empty: true })).toBe('empty');
      expect(widgetState({ failed: false, hasValue: true })).toBe('ready');
    });

    it('with no response yet: loading', () => {
      expect(widgetState({ failed: false, hasValue: false })).toBe('loading');
    });
  });

  describe('status mapping', () => {
    it('each group comes from a back-end status, and Cancelado is not a group', () => {
      expect(DASHBOARD_STATUS_GROUP_STATUS).toEqual({
        open: TicketStatus.Open, inProgress: TicketStatus.InProgress, resolved: TicketStatus.Resolved, closed: TicketStatus.Closed
      });
      expect(Object.values(DASHBOARD_STATUS_GROUP_STATUS)).not.toContain(TicketStatus.Canceled);
    });
  });

  describe('statusComposition', () => {
    it('splits the bar without the canceled ones, and bar + canceled adds up to the total', () => {
      const composition = statusComposition({ totalCount: 12, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 2 });
      expect(composition.segments.map(s => [s.group, s.count, s.percent])).toEqual([
        ['open', 3, 30], ['inProgress', 2, 20], ['resolved', 4, 40], ['closed', 1, 10]
      ]);
      expect(composition.inBar + composition.canceled).toBe(composition.total);
    });

    it('rounds by largest remainder, so the percentages add up to 100', () => {
      const composition = statusComposition({ totalCount: 3, openCount: 1, inProgressCount: 1, resolvedCount: 1, closedCount: 0, canceledCount: 0 });
      expect(composition.segments.reduce((sum, s) => sum + s.percent, 0)).toBe(100);
    });

    it('with no tickets at all, everything is zero (without dividing by zero)', () => {
      const composition = statusComposition({ totalCount: 0, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 });
      expect(composition.segments.every(s => s.percent === 0)).toBeTrue();
    });
  });

  describe('pt-BR formatting', () => {
    it('full up to 9,999, compact from there up', () => {
      // O Intl separa número e unidade com espaço não separável (não quebra "12,3 | mil").
      expect(formatCount(1240)).toBe('1.240');
      expect(formatCount(12345)).toMatch(/^12,3\smil$/);
      expect(formatCount(2_500_000)).toMatch(/^2,5\smi$/);
    });

    it('compacts the axes ("1,2 mil")', () => {
      expect(formatCompactCount(1200)).toMatch(/^1,2\smil$/);
      expect(formatCompactCount(40)).toBe('40');
    });
  });

  describe('freshnessLabel', () => {
    const now = new Date(2026, 9, 28, 15, 30).getTime();

    it('now, N min ago and, after an hour, the time of day', () => {
      expect(freshnessLabel(null, now)).toBeNull();
      expect(freshnessLabel(now - 20_000, now)).toBe('Atualizado agora');
      expect(freshnessLabel(now - 2 * 60_000, now)).toBe('Atualizado há 2 min');
      expect(freshnessLabel(now - 90 * 60_000, now)).toBe('Atualizado às 14:00');
    });
  });

  describe('accessNote', () => {
    it('says how many the person sees only when it is fewer than the company number', () => {
      expect(accessNote(12, 340)).toBe('Você tem acesso a 12 dos 340 chamados');
      expect(accessNote(5, 5)).toBeNull();
      expect(accessNote(null, 5)).toBeNull();
      // Sem acesso a nenhum: frase própria, com o singular certo.
      expect(accessNote(0, 340)).toBe('Você não tem acesso a nenhum destes 340 chamados');
      expect(accessNote(0, 1)).toBe('Você não tem acesso a este chamado');
    });
  });

  describe('periods (Brasília time zone, as the back end groups them)', () => {
    it('day, Monday-to-Sunday week and full month', () => {
      expect(bucketRange('2026-10-27', 'Day')).toEqual({ from: '2026-10-27', to: '2026-10-27' });
      expect(bucketRange('2026-10-26', 'Week')).toEqual({ from: '2026-10-26', to: '2026-11-01' });
      expect(bucketRange('2026-02-01', 'Month')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
      expect(bucketRange('2028-02-01', 'Month')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    });

    it('short (axis) and long (tooltip and table) labels', () => {
      expect(bucketShortLabel('2026-10-26', 'Week')).toBe('26/10');
      expect(bucketShortLabel('2026-10-01', 'Month')).toBe('out/26');
      expect(bucketLongLabel('2026-10-25', 'Day')).toBe('domingo, 25/10/2026');
      expect(bucketLongLabel('2026-10-28', 'Day')).toBe('quarta, 28/10/2026');
      expect(bucketLongLabel('2026-10-26', 'Week')).toBe('Semana de 26/10/2026 a 01/11/2026');
      expect(bucketLongLabel('2026-10-01', 'Month')).toBe('out/2026');
    });
  });

  describe('weekend shading', () => {
    it('marks Saturdays and Sundays by local date, only in the by-day grouping', () => {
      // 24/10/2026 é sábado e 25/10 domingo.
      const points = ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'].map(periodStart => ({ periodStart, count: 1 }));
      expect(weekendIndexes(points, 'Day')).toEqual([1, 2]);
      expect(weekendIndexes(points, 'Week')).toEqual([]);
      expect(weekendIndexes(points, 'Month')).toEqual([]);
    });
  });

  describe('period average', () => {
    it('uses only complete periods: the current one, half done, is left out', () => {
      expect(periodAverage(days([2, 4, 6, 100]))).toBe(4);
    });

    it('without at least two complete periods, there is no average', () => {
      expect(periodAverage(days([5, 9]))).toBeNull();
      expect(periodAverage([])).toBeNull();
    });

    it('formats with one decimal place in pt-BR, as an integer when there is no fraction', () => {
      expect(formatAverage(4.333)).toBe('4,3');
      expect(formatAverage(5)).toBe('5');
    });
  });

  describe('volumeInsight (thresholds in DASHBOARD_INSIGHT_RULES)', () => {
    /** 15 dias: os 7 anteriores com `before` por dia, os 7 até ontem com `after`, e hoje (ignorado). */
    const series = (before: number, after: number, today = 99) => days([...Array(7).fill(before), ...Array(7).fill(after), today]);

    it('rise above the threshold, in plain language, ignoring today (half done)', () => {
      expect(volumeInsight(series(10, 12), 'Day')).toBe('14 chamados a mais (+20%) nos 7 dias até ontem que nos 7 anteriores.');
    });

    it('drop above the threshold', () => {
      expect(volumeInsight(series(10, 8), 'Day')).toBe('14 chamados a menos (−20%) nos 7 dias até ontem que nos 7 anteriores.');
    });

    it('variation below the threshold is stable', () => {
      expect(volumeInsight(series(10, 10.5), 'Day')).toBe('A entrada de chamados ficou estável nos 7 dias até ontem.');
    });

    it('below the minimum sample, no sentence', () => {
      const tiny = DASHBOARD_INSIGHT_RULES.minimumSample / 7 - 0.5;
      expect(volumeInsight(series(tiny, 5), 'Day')).toBeNull();
    });

    it('without enough points, no sentence (a single period, for example)', () => {
      expect(volumeInsight(days([40]), 'Day')).toBeNull();
      expect(volumeInsight(days([40, 50]), 'Week')).toBeNull();
    });

    it('by week, compares last week (complete) with the previous one, not the current one half done', () => {
      expect(volumeInsight(days([20, 30, 1]), 'Week')).toBe('10 chamados a mais (+50%) na semana passada que na anterior.');
      expect(volumeInsight(days([20, 30, 1]), 'Month')).toBe('10 chamados a mais (+50%) no mês passado que no anterior.');
    });

    it('when the response brings the resolved ones (spec 028), compares incoming and resolutions in the same window, with no flag', () => {
      const created = Array(15).fill(10);
      expect(volumeInsight(days(created, Array(15).fill(12)), 'Day')).toBe('Mais chamados resolvidos do que abertos nos 7 dias até ontem.');
      expect(volumeInsight(days(created, Array(15).fill(8)), 'Day')).toBe('Entraram mais chamados do que foram resolvidos nos 7 dias até ontem.');
      expect(volumeInsight(days(created, Array(15).fill(10.2)), 'Day')).toBe('Tantos chamados resolvidos quanto abertos nos 7 dias até ontem.');
    });

    it('incoming and resolutions in balance only describe the two numbers: no sentence deduces the queue from them (spec 032)', () => {
      const created = Array(15).fill(10);
      const balanced = volumeInsight(days(created, Array(15).fill(10)), 'Day');
      expect(balanced).toBe('Tantos chamados resolvidos quanto abertos nos 7 dias até ontem.');
      // Nenhum desfecho da comparação fala da fila: por dia, por semana e por mês, acima, abaixo e no equilíbrio.
      const sentences = [12, 8, 10, 10.2].flatMap(resolved => (['Day', 'Week', 'Month'] as const)
        .map(groupBy => volumeInsight(days(created, Array(15).fill(resolved)), groupBy)));
      expect(sentences.every(sentence => sentence !== null)).toBeTrue();
      sentences.forEach(sentence => expect(sentence).not.toMatch(/fila/i));
    });

    it('the thresholds come from a single place (changing the rule changes the sentence)', () => {
      expect(volumeInsight(series(10, 11.5), 'Day', { ...DASHBOARD_INSIGHT_RULES, changePercent: 20 })).toBe('A entrada de chamados ficou estável nos 7 dias até ontem.');
    });
  });
});
