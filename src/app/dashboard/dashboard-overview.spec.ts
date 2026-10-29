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
    it('indisponível vence tudo (flag desligada: nem pergunta)', () => {
      expect(widgetState({ available: false, failed: true, hasValue: true })).toBe('unavailable');
    });

    it('erro de uma rota que existe é erro', () => {
      expect(widgetState({ available: true, failed: true, hasValue: false })).toBe('error');
    });

    it('com resposta: vazio ou pronto; numa recarga, a resposta anterior continua valendo', () => {
      expect(widgetState({ available: true, failed: false, hasValue: true, empty: true })).toBe('empty');
      expect(widgetState({ available: true, failed: false, hasValue: true })).toBe('ready');
    });

    it('sem resposta ainda: carregando', () => {
      expect(widgetState({ available: true, failed: false, hasValue: false })).toBe('loading');
    });
  });

  describe('mapeamento de status', () => {
    it('cada grupo vem de um status do back-end, e Cancelado não é grupo', () => {
      expect(DASHBOARD_STATUS_GROUP_STATUS).toEqual({
        open: TicketStatus.Open, inProgress: TicketStatus.InProgress, resolved: TicketStatus.Resolved, closed: TicketStatus.Closed
      });
      expect(Object.values(DASHBOARD_STATUS_GROUP_STATUS)).not.toContain(TicketStatus.Canceled);
    });
  });

  describe('statusComposition', () => {
    it('divide a barra sem os cancelados, e barra + cancelados fecha com o total', () => {
      const composition = statusComposition({ totalCount: 12, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 2 });
      expect(composition.segments.map(s => [s.group, s.count, s.percent])).toEqual([
        ['open', 3, 30], ['inProgress', 2, 20], ['resolved', 4, 40], ['closed', 1, 10]
      ]);
      expect(composition.inBar + composition.canceled).toBe(composition.total);
    });

    it('arredonda pelo maior resto, pra os percentuais somarem 100', () => {
      const composition = statusComposition({ totalCount: 3, openCount: 1, inProgressCount: 1, resolvedCount: 1, closedCount: 0, canceledCount: 0 });
      expect(composition.segments.reduce((sum, s) => sum + s.percent, 0)).toBe(100);
    });

    it('sem nenhum chamado, tudo zero (sem dividir por zero)', () => {
      const composition = statusComposition({ totalCount: 0, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 });
      expect(composition.segments.every(s => s.percent === 0)).toBeTrue();
    });
  });

  describe('formatação pt-BR', () => {
    it('completa até 9.999, compacta daí pra cima', () => {
      // O Intl separa número e unidade com espaço não separável (não quebra "12,3 | mil").
      expect(formatCount(1240)).toBe('1.240');
      expect(formatCount(12345)).toMatch(/^12,3\smil$/);
      expect(formatCount(2_500_000)).toMatch(/^2,5\smi$/);
    });

    it('compacta os eixos ("1,2 mil")', () => {
      expect(formatCompactCount(1200)).toMatch(/^1,2\smil$/);
      expect(formatCompactCount(40)).toBe('40');
    });
  });

  describe('freshnessLabel', () => {
    const now = new Date(2026, 9, 28, 15, 30).getTime();

    it('agora, há N min e, depois de uma hora, o horário', () => {
      expect(freshnessLabel(null, now)).toBeNull();
      expect(freshnessLabel(now - 20_000, now)).toBe('Atualizado agora');
      expect(freshnessLabel(now - 2 * 60_000, now)).toBe('Atualizado há 2 min');
      expect(freshnessLabel(now - 90 * 60_000, now)).toBe('Atualizado às 14:00');
    });
  });

  describe('accessNote', () => {
    it('diz quantos a pessoa vê só quando é menos que o número da empresa', () => {
      expect(accessNote(12, 340)).toBe('Você tem acesso a 12 dos 340 chamados');
      expect(accessNote(5, 5)).toBeNull();
      expect(accessNote(null, 5)).toBeNull();
      // Sem acesso a nenhum: frase própria, com o singular certo.
      expect(accessNote(0, 340)).toBe('Você não tem acesso a nenhum destes 340 chamados');
      expect(accessNote(0, 1)).toBe('Você não tem acesso a este chamado');
    });
  });

  describe('períodos (fuso de Brasília, como o back-end agrupa)', () => {
    it('dia, semana de segunda a domingo e mês inteiro', () => {
      expect(bucketRange('2026-10-27', 'Day')).toEqual({ from: '2026-10-27', to: '2026-10-27' });
      expect(bucketRange('2026-10-26', 'Week')).toEqual({ from: '2026-10-26', to: '2026-11-01' });
      expect(bucketRange('2026-02-01', 'Month')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
      expect(bucketRange('2028-02-01', 'Month')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    });

    it('rótulos curto (eixo) e longo (tooltip e tabela)', () => {
      expect(bucketShortLabel('2026-10-26', 'Week')).toBe('26/10');
      expect(bucketShortLabel('2026-10-01', 'Month')).toBe('out/26');
      expect(bucketLongLabel('2026-10-25', 'Day')).toBe('domingo, 25/10/2026');
      expect(bucketLongLabel('2026-10-28', 'Day')).toBe('quarta, 28/10/2026');
      expect(bucketLongLabel('2026-10-26', 'Week')).toBe('Semana de 26/10/2026 a 01/11/2026');
      expect(bucketLongLabel('2026-10-01', 'Month')).toBe('out/2026');
    });
  });

  describe('sombreado de fim de semana', () => {
    it('marca sábados e domingos pela data local, só no agrupamento por dia', () => {
      // 24/10/2026 é sábado e 25/10 domingo.
      const points = ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'].map(periodStart => ({ periodStart, count: 1 }));
      expect(weekendIndexes(points, 'Day')).toEqual([1, 2]);
      expect(weekendIndexes(points, 'Week')).toEqual([]);
      expect(weekendIndexes(points, 'Month')).toEqual([]);
    });
  });

  describe('média do período', () => {
    it('usa só os períodos completos: o atual, pela metade, fica fora', () => {
      expect(periodAverage(days([2, 4, 6, 100]))).toBe(4);
    });

    it('sem pelo menos dois períodos completos, não há média', () => {
      expect(periodAverage(days([5, 9]))).toBeNull();
      expect(periodAverage([])).toBeNull();
    });

    it('formata com uma casa em pt-BR, inteira quando não há fração', () => {
      expect(formatAverage(4.333)).toBe('4,3');
      expect(formatAverage(5)).toBe('5');
    });
  });

  describe('volumeInsight (limiares em DASHBOARD_INSIGHT_RULES)', () => {
    /** 15 dias: os 7 anteriores com `before` por dia, os 7 até ontem com `after`, e hoje (ignorado). */
    const series = (before: number, after: number, today = 99) => days([...Array(7).fill(before), ...Array(7).fill(after), today]);

    it('subida acima do limiar, em linguagem simples, ignorando o dia de hoje (pela metade)', () => {
      expect(volumeInsight(series(10, 12), 'Day')).toBe('14 chamados a mais (+20%) nos 7 dias até ontem que nos 7 anteriores.');
    });

    it('queda acima do limiar', () => {
      expect(volumeInsight(series(10, 8), 'Day')).toBe('14 chamados a menos (−20%) nos 7 dias até ontem que nos 7 anteriores.');
    });

    it('variação abaixo do limiar é estável', () => {
      expect(volumeInsight(series(10, 10.5), 'Day')).toBe('A entrada de chamados ficou estável nos 7 dias até ontem.');
    });

    it('abaixo da amostra mínima, nenhuma frase', () => {
      const tiny = DASHBOARD_INSIGHT_RULES.minimumSample / 7 - 0.5;
      expect(volumeInsight(series(tiny, 5), 'Day')).toBeNull();
    });

    it('sem pontos suficientes, nenhuma frase (um período só, por exemplo)', () => {
      expect(volumeInsight(days([40]), 'Day')).toBeNull();
      expect(volumeInsight(days([40, 50]), 'Week')).toBeNull();
    });

    it('por semana, compara a semana passada (completa) com a anterior, não a atual pela metade', () => {
      expect(volumeInsight(days([20, 30, 1]), 'Week')).toBe('10 chamados a mais (+50%) na semana passada que na anterior.');
      expect(volumeInsight(days([20, 30, 1]), 'Month')).toBe('10 chamados a mais (+50%) no mês passado que no anterior.');
    });

    it('com a flag dos resolvidos ligada (spec 028), compara entradas e resoluções na mesma janela', () => {
      const created = Array(15).fill(10);
      expect(volumeInsight(days(created, Array(15).fill(12)), 'Day', true)).toBe('Mais chamados resolvidos do que abertos nos 7 dias até ontem.');
      expect(volumeInsight(days(created, Array(15).fill(8)), 'Day', true)).toBe('Entraram mais chamados do que foram resolvidos nos 7 dias até ontem.');
      expect(volumeInsight(days(created, Array(15).fill(10.2)), 'Day', true)).toBe('Fila estável: tantos chamados resolvidos quanto abertos nos 7 dias até ontem.');
    });

    it('com a flag desligada, nunca afirma nada sobre a fila, mesmo se a resposta trouxer resolvidos', () => {
      const insight = volumeInsight(days(Array(15).fill(10), Array(15).fill(30)), 'Day');
      expect(insight).toBe('A entrada de chamados ficou estável nos 7 dias até ontem.');
      expect(insight).not.toContain('resolvidos');
    });

    it('os limiares vêm de um lugar só (trocar a regra muda a frase)', () => {
      expect(volumeInsight(series(10, 11.5), 'Day', false, { ...DASHBOARD_INSIGHT_RULES, changePercent: 20 })).toBe('A entrada de chamados ficou estável nos 7 dias até ontem.');
    });
  });
});
