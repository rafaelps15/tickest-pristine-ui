import { valueOf } from './resource-value.util';

describe('valueOf', () => {
  it('returns the value when the resource has a value', () => {
    expect(valueOf({ hasValue: () => true, value: () => 42 })).toBe(42);
  });

  it('returns undefined without calling value() when the resource has no value (e.g. on error)', () => {
    const value = jasmine.createSpy('value').and.throwError('resource em erro');
    expect(valueOf({ hasValue: () => false, value })).toBeUndefined();
    expect(value).not.toHaveBeenCalled();
  });
});
