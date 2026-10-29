import { valueOf } from './resource-value.util';

describe('valueOf', () => {
  it('devolve o valor quando o resource tem valor', () => {
    expect(valueOf({ hasValue: () => true, value: () => 42 })).toBe(42);
  });

  it('devolve undefined sem chamar value() quando o resource não tem valor (ex.: em erro)', () => {
    const value = jasmine.createSpy('value').and.throwError('resource em erro');
    expect(valueOf({ hasValue: () => false, value })).toBeUndefined();
    expect(value).not.toHaveBeenCalled();
  });
});
