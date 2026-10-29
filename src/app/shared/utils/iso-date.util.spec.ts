import { formatIsoDate, isIsoDate, previousIsoRange, shiftIsoDate } from './iso-date.util';

describe('iso-date.util', () => {
  it('valida e formata datas aaaa-mm-dd', () => {
    expect(isIsoDate('2026-10-28')).toBeTrue();
    expect(isIsoDate('2026-02-30')).toBeFalse();
    expect(formatIsoDate('2026-10-28')).toBe('28/10/2026');
  });

  it('soma dias atravessando mês e ano', () => {
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('o período anterior tem o mesmo tamanho e termina na véspera do início', () => {
    expect(previousIsoRange('2026-10-01', '2026-10-30')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(previousIsoRange('2026-10-22', '2026-10-28')).toEqual({ from: '2026-10-15', to: '2026-10-21' });
    expect(previousIsoRange('2026-10-28', '2026-10-28')).toEqual({ from: '2026-10-27', to: '2026-10-27' });
  });
});
