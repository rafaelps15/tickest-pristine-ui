import { signal } from '@angular/core';
import { PagedResponse } from '../entities/paged-response';
import { pagedResponseSignals } from './paged-response.util';

describe('pagedResponseSignals', () => {
  const page = signal<PagedResponse<string> | undefined>(undefined);
  const requested = signal({ page: 3, pageSize: 50 });
  const signals = pagedResponseSignals(page, () => requested().page, () => requested().pageSize);

  beforeEach(() => page.set(undefined));

  it('uses the requested page and size, with no totals, while the response has not arrived', () => {
    expect(signals.currentPage()).toBe(3);
    expect(signals.currentPageSize()).toBe(50);
    expect(signals.total()).toBe(0);
    expect(signals.totalPages()).toBe(0);
    expect(signals.hasPreviousPage()).toBeFalse();
    expect(signals.hasNextPage()).toBeFalse();
  });

  it('follows the page returned by the API', () => {
    page.set({ items: ['a'], page: 2, pageSize: 20, totalCount: 41, totalPages: 3, hasPreviousPage: true, hasNextPage: true });

    expect(signals.currentPage()).toBe(2);
    expect(signals.currentPageSize()).toBe(20);
    expect(signals.total()).toBe(41);
    expect(signals.totalPages()).toBe(3);
    expect(signals.hasPreviousPage()).toBeTrue();
    expect(signals.hasNextPage()).toBeTrue();
  });
});
