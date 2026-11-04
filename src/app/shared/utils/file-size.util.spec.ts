import { formatFileSize } from './file-size.util';

describe('formatFileSize', () => {
  it('shows in KB, with no decimals, below 1 MB', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024 KB');
  });

  it('shows in MB with one decimal from 1 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});
