import { formatSlaDuration } from './sla-duration.util';

/** Um minuto, em milissegundos. */
const MINUTE = 60_000;
/** Uma hora, em milissegundos. */
const HOUR = 60 * MINUTE;

describe('formatSlaDuration', () => {
  it('formats in short pt-BR, from minutes to days', () => {
    expect(formatSlaDuration(20_000)).toBe('menos de 1 min');
    expect(formatSlaDuration(35 * 60_000)).toBe('35 min');
    expect(formatSlaDuration(2 * 3_600_000)).toBe('2h');
    expect(formatSlaDuration(2 * 3_600_000 + 14 * 60_000)).toBe('2h 14min');
    expect(formatSlaDuration(26 * 3_600_000)).toBe('1 dia');
    expect(formatSlaDuration(72 * 3_600_000)).toBe('3 dias');
  });

  it('changes the unit exactly at one minute, one hour and one day, rounding down', () => {
    expect(formatSlaDuration(MINUTE - 1)).toBe('menos de 1 min');
    expect(formatSlaDuration(MINUTE)).toBe('1 min');
    expect(formatSlaDuration(HOUR - 1)).toBe('59 min');
    expect(formatSlaDuration(HOUR)).toBe('1h');
    expect(formatSlaDuration(24 * HOUR - MINUTE)).toBe('23h 59min');
    expect(formatSlaDuration(24 * HOUR)).toBe('1 dia');
    expect(formatSlaDuration(48 * HOUR - 1)).toBe('1 dia');
    expect(formatSlaDuration(48 * HOUR)).toBe('2 dias');
  });
});
