import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessage, isTransientHttpError } from './http-error.util';

describe('http-error.util', () => {
  describe('extractErrorMessage', () => {
    it('prefers the validation errors of the API, joined in a single message', () => {
      const error = new HttpErrorResponse({
        status: 400,
        error: {
          title: 'Validation.General', detail: 'Um ou mais campos são inválidos.',
          errors: [
            { code: 'Title.Required', description: 'O título é obrigatório.', type: 'Validation' },
            { code: 'Description.Required', description: 'A descrição é obrigatória.', type: 'Validation' }
          ]
        }
      });

      expect(extractErrorMessage(error)).toBe('O título é obrigatório. A descrição é obrigatória.');
    });

    it('without a list of validation errors, uses the detail of the Problem Details, and the title when there is no detail', () => {
      const withDetail = new HttpErrorResponse({ status: 409, error: { title: 'Tickets.Conflict', detail: 'O chamado mudou.', errors: [] } });
      const dictionary = new HttpErrorResponse({ status: 400, error: { detail: 'Campos inválidos.', errors: { Title: ['Obrigatório'] } } });
      const onlyTitle = new HttpErrorResponse({ status: 403, error: { title: 'Você não tem permissão.' } });

      expect(extractErrorMessage(withDetail)).toBe('O chamado mudou.');
      expect(extractErrorMessage(dictionary)).toBe('Campos inválidos.');
      expect(extractErrorMessage(onlyTitle)).toBe('Você não tem permissão.');
    });

    it('when the body brings no message, uses the message of the status, then the fallback of the call, then the default one', () => {
      const error = new HttpErrorResponse({ status: 403 });

      expect(extractErrorMessage(error, { 403: 'Sem permissão para salvar.' }, 'Erro ao salvar.')).toBe('Sem permissão para salvar.');
      expect(extractErrorMessage(error, { 404: 'Não encontrado.' }, 'Erro ao salvar.')).toBe('Erro ao salvar.');
      expect(extractErrorMessage(error)).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });

    it('without a server response (status 0), ignores the network error and says the connection failed, unless the call has its own message', () => {
      const error = new HttpErrorResponse({ status: 0, error: { title: 'TypeError', detail: 'Failed to fetch' } });

      expect(extractErrorMessage(error)).toBe('Não foi possível conectar ao servidor. Verifique sua conexão.');
      expect(extractErrorMessage(error, { 0: 'Sem conexão com o servidor.' })).toBe('Sem conexão com o servidor.');
    });
  });

  describe('isTransientHttpError', () => {
    it('treats no server response, the rate limit and server errors as transient', () => {
      for (const status of [0, 429, 500, 503]) {
        expect(isTransientHttpError(new HttpErrorResponse({ status }))).withContext(String(status)).toBeTrue();
      }
    });

    it('does not treat a refusal of the session or of the operation, nor an error that is not HTTP, as transient', () => {
      for (const status of [400, 401, 403, 404, 409]) {
        expect(isTransientHttpError(new HttpErrorResponse({ status }))).withContext(String(status)).toBeFalse();
      }
      expect(isTransientHttpError(new Error('boom'))).toBeFalse();
      expect(isTransientHttpError(null)).toBeFalse();
    });
  });
});
