import { TimeOfDayPipe } from './time-of-day.pipe';
import { formatTimeOfDay } from '../../utils/date-time.util';

describe('TimeOfDayPipe', () => {
  const pipe = new TimeOfDayPipe();

  it('formats the instant as the time of day, the same as the dashboard code', () => {
    const ms = new Date(2026, 0, 2, 14, 5).getTime();

    expect(pipe.transform(ms)).toBe('14:05');
    expect(pipe.transform(new Date(ms))).toBe(formatTimeOfDay(ms));
  });

  it('returns null without a value', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });
});
