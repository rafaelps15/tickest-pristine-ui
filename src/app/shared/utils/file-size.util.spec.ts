import { formatFileSize } from './file-size.util';

describe('formatFileSize', () => {
  it('mostra em KB, sem casas, abaixo de 1 MB', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024 KB');
  });

  it('mostra em MB com uma casa a partir de 1 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});
