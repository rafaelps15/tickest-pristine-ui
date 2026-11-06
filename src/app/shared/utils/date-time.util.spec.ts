import { formatDate } from '@angular/common';
import { DATE_TIME_FORMAT, formatTimeOfDay } from './date-time.util';

describe('date-time.util', () => {
  it('formats the time of day in 24 h with two digits, in the browser time zone', () => {
    expect(formatTimeOfDay(new Date(2026, 0, 2, 9, 5).getTime())).toBe('09:05');
    expect(formatTimeOfDay(new Date(2026, 0, 2, 0, 0))).toBe('00:00');
    expect(formatTimeOfDay(new Date(2026, 0, 2, 23, 59))).toBe('23:59');
  });

  it('gives, minute by minute, the same text as the DatePipe format HH:mm that the templates used', () => {
    const start = new Date(2026, 9, 6, 0, 0).getTime();
    const minutes = Array.from({ length: 24 * 60 }, (_, minute) => start + minute * 60_000);

    expect(minutes.map(ms => formatTimeOfDay(ms))).toEqual(minutes.map(ms => formatDate(ms, 'HH:mm', 'en-US')));
  });

  it('keeps the date and time format of the screens', () => {
    expect(DATE_TIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
  });
});
