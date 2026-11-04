import { HttpErrorResponse } from '@angular/common/http';
import { parseSessionUnavailableReason, safeReturnUrl, transientFailureReason } from './session-unavailable.util';

describe('session-unavailable.util', () => {
  it('accepts only internal paths as the return', () => {
    expect(safeReturnUrl('/tickets?status=1')).toBe('/tickets?status=1');
    expect(safeReturnUrl('https://outro-site.com')).toBe('/dashboard');
    expect(safeReturnUrl('//outro-site.com')).toBe('/dashboard');
    expect(safeReturnUrl(null)).toBe('/dashboard');
  });

  it('does not go back to the session-unavailable screen itself', () => {
    expect(safeReturnUrl('/sessao-indisponivel?motivo=offline')).toBe('/dashboard');
  });

  it('reads the reason from the URL and replaces an unknown value with a server error', () => {
    expect(parseSessionUnavailableReason('rate-limited')).toBe('rate-limited');
    expect(parseSessionUnavailableReason('offline')).toBe('offline');
    expect(parseSessionUnavailableReason('qualquer')).toBe('server-error');
    expect(parseSessionUnavailableReason(null)).toBe('server-error');
  });

  it('classifies the transient failure by the screen reason and returns null for the others', () => {
    expect(transientFailureReason(new HttpErrorResponse({ status: 0 }))).toBe('offline');
    expect(transientFailureReason(new HttpErrorResponse({ status: 429 }))).toBe('rate-limited');
    expect(transientFailureReason(new HttpErrorResponse({ status: 503 }))).toBe('server-error');
    expect(transientFailureReason(new HttpErrorResponse({ status: 401 }))).toBeNull();
    expect(transientFailureReason(new Error('boom'))).toBeNull();
  });
});
