import { formatIsoDate, isIsoDate, previousIsoRange, shiftIsoDate, todayInSaoPaulo } from './iso-date.util';

describe('iso-date.util', () => {
  it('todayInSaoPaulo uses the Brasília date, not UTC, near midnight', () => {
    expect(todayInSaoPaulo(new Date('2026-11-01T02:30:00Z'))).toBe('2026-10-31');
    expect(todayInSaoPaulo(new Date('2026-11-01T03:00:00Z'))).toBe('2026-11-01');
  });

  it('validates and formats yyyy-mm-dd dates', () => {
    expect(isIsoDate('2026-10-28')).toBeTrue();
    expect(isIsoDate('2026-02-30')).toBeFalse();
    expect(formatIsoDate('2026-10-28')).toBe('28/10/2026');
  });

  it('adds days across month and year boundaries', () => {
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('the previous period has the same length and ends the day before the start', () => {
    expect(previousIsoRange('2026-10-01', '2026-10-30')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(previousIsoRange('2026-10-22', '2026-10-28')).toEqual({ from: '2026-10-15', to: '2026-10-21' });
    expect(previousIsoRange('2026-10-28', '2026-10-28')).toEqual({ from: '2026-10-27', to: '2026-10-27' });
  });
});
