import { HttpErrorResponse } from '@angular/common/http';
import { ticketReadErrorMessage } from './ticket-read-error';

describe('ticketReadErrorMessage', () => {
  /** Falha do GET /tickets/{id} com o status e o corpo dados. */
  function readError(status: number, error: unknown = null): HttpErrorResponse {
    return new HttpErrorResponse({ status, error });
  }

  it('uses the shared sentences for 403 and 404, whatever the screen', () => {
    expect(ticketReadErrorMessage(readError(403), 'Erro ao carregar o chamado')).toBe('Você não tem acesso a este chamado.');
    expect(ticketReadErrorMessage(readError(404), 'Erro ao carregar os detalhes do chamado'))
      .toBe('Não encontramos esse chamado — ele pode ter sido removido.');
  });

  it("falls back to each screen's own text for the other statuses", () => {
    expect(ticketReadErrorMessage(readError(500), 'Erro ao carregar o chamado')).toBe('Erro ao carregar o chamado');
    expect(ticketReadErrorMessage(readError(500), 'Erro ao carregar os detalhes do chamado')).toBe('Erro ao carregar os detalhes do chamado');
  });

  it('prefers the message in the API body and keeps the connection message for status 0', () => {
    expect(ticketReadErrorMessage(readError(404, { detail: 'Chamado arquivado.' }), 'Erro ao carregar o chamado')).toBe('Chamado arquivado.');
    expect(ticketReadErrorMessage(readError(0), 'Erro ao carregar o chamado')).toBe('Não foi possível conectar ao servidor. Verifique sua conexão.');
  });
});
