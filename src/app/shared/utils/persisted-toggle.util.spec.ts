import { hasPersistedToggle, readPersistedToggle, writePersistedToggle } from './persisted-toggle.util';

/** Chave usada só por esta spec. */
const STORAGE_KEY = 'tickest.spec.persistedToggle';

describe('persisted-toggle.util', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('reads the default while nothing is saved, and the saved value afterwards', () => {
    expect(readPersistedToggle(STORAGE_KEY, true)).toBeTrue();
    expect(readPersistedToggle(STORAGE_KEY, false)).toBeFalse();

    writePersistedToggle(STORAGE_KEY, false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(readPersistedToggle(STORAGE_KEY, true)).toBeFalse();

    writePersistedToggle(STORAGE_KEY, true);
    expect(readPersistedToggle(STORAGE_KEY, false)).toBeTrue();
  });

  it('tells whether a preference was already saved, even a false one', () => {
    expect(hasPersistedToggle(STORAGE_KEY)).toBeFalse();

    writePersistedToggle(STORAGE_KEY, false);

    expect(hasPersistedToggle(STORAGE_KEY)).toBeTrue();
  });

  it('keeps working when the storage fails (e.g. private mode): reads the default and does not throw on writing', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado (ex.: modo privado)');
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');

    expect(readPersistedToggle(STORAGE_KEY, true)).toBeTrue();
    expect(hasPersistedToggle(STORAGE_KEY)).toBeFalse();
    expect(() => writePersistedToggle(STORAGE_KEY, true)).not.toThrow();
  });
});
