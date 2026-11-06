import { DATE_PIPE_DEFAULT_OPTIONS, DatePipe } from '@angular/common';
import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateTimePipe } from './date-time.pipe';

describe('DateTimePipe', () => {
  /** Cria o pipe com os provedores dados, como o template cria. */
  function createPipe(providers: unknown[] = []): DateTimePipe {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), ...providers] });
    return TestBed.runInInjectionContext(() => new DateTimePipe());
  }

  it('gives the same text as the DatePipe with dd/MM/yyyy HH:mm, in the browser time zone', () => {
    const pipe = createPipe();
    const datePipe = new DatePipe(TestBed.inject(LOCALE_ID));
    const values = ['2026-01-02T03:04:05Z', '2026-12-31T23:59:00Z', new Date(2026, 5, 15, 8, 30), Date.UTC(2026, 1, 28, 12, 0)];

    expect(values.map(value => pipe.transform(value))).toEqual(values.map(value => datePipe.transform(value, 'dd/MM/yyyy HH:mm')));
    expect(pipe.transform(new Date(2026, 5, 15, 8, 30))).toBe('15/06/2026 08:30');
  });

  it('returns null without a date, like the DatePipe', () => {
    const pipe = createPipe();

    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
  });

  it('follows the default DatePipe options of the application, such as the time zone', () => {
    const pipe = createPipe([{ provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '+0000' } }]);

    expect(pipe.transform('2026-01-02T03:04:05Z')).toBe('02/01/2026 03:04');
  });
});
