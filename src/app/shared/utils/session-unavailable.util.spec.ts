import { HttpErrorResponse } from '@angular/common/http';
import { parseSessionUnavailableReason, safeReturnUrl, transientFailureReason } from './session-unavailable.util';

describe('session-unavailable.util', () => {
  it('aceita como retorno só caminhos internos', () => {
    expect(safeReturnUrl('/tickets?status=1')).toBe('/tickets?status=1');
    expect(safeReturnUrl('https://outro-site.com')).toBe('/dashboard');
    expect(safeReturnUrl('//outro-site.com')).toBe('/dashboard');
    expect(safeReturnUrl(null)).toBe('/dashboard');
  });

  it('não volta para a própria tela de sessão indisponível', () => {
    expect(safeReturnUrl('/sessao-indisponivel?motivo=offline')).toBe('/dashboard');
  });

  it('lê o motivo da URL e troca um valor desconhecido por erro do servidor', () => {
    expect(parseSessionUnavailableReason('rate-limited')).toBe('rate-limited');
    expect(parseSessionUnavailableReason('offline')).toBe('offline');
    expect(parseSessionUnavailableReason('qualquer')).toBe('server-error');
    expect(parseSessionUnavailableReason(null)).toBe('server-error');
  });

  it('classifica a falha passageira pelo motivo da tela e devolve null para as demais', () => {
    expect(transientFailureReason(new HttpErrorResponse({ status: 0 }))).toBe('offline');
    expect(transientFailureReason(new HttpErrorResponse({ status: 429 }))).toBe('rate-limited');
    expect(transientFailureReason(new HttpErrorResponse({ status: 503 }))).toBe('server-error');
    expect(transientFailureReason(new HttpErrorResponse({ status: 401 }))).toBeNull();
    expect(transientFailureReason(new Error('boom'))).toBeNull();
  });
});
