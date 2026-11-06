import { cursorPageParams } from './cursor-page.util';

describe('cursorPageParams', () => {
  it('sends no parameter for the first page', () => {
    expect(cursorPageParams().keys()).toEqual([]);
  });

  it('sends the cursor of the previous page', () => {
    const params = cursorPageParams({ cursorDate: '2026-01-01T12:00:00Z', cursorId: 'a1' });

    expect(params.get('cursorDate')).toBe('2026-01-01T12:00:00Z');
    expect(params.get('cursorId')).toBe('a1');
    expect(params.has('pageSize')).toBeFalse();
  });

  it('sends the page size only when one is given', () => {
    expect(cursorPageParams(undefined, 5).get('pageSize')).toBe('5');
    expect(cursorPageParams(undefined, 0).has('pageSize')).toBeFalse();
  });
});
