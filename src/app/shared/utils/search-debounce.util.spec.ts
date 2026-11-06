import { SEARCH_DEBOUNCE_MS } from './search-debounce.util';

describe('SEARCH_DEBOUNCE_MS', () => {
  it('keeps the 300 ms wait that the five search fields used', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });
});
