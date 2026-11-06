import { HttpErrorResponse } from '@angular/common/http';
import { TICKET_ASSIGN_CONFLICT_MESSAGE, assignResponsibleErrorMessage } from './ticket-assign-error';

describe('assignResponsibleErrorMessage', () => {
  /** Falha do PUT /tickets/{id}/assignee com o status e o corpo dados. */
  function assignError(status: number, error: unknown = null): HttpErrorResponse {
    return new HttpErrorResponse({ status, error });
  }

  it('uses the shared sentences for 403, 404 and 409, and the generic text for the rest', () => {
    expect(assignResponsibleErrorMessage(assignError(403))).toBe('Você não tem permissão para atribuir o responsável deste chamado.');
    expect(assignResponsibleErrorMessage(assignError(404))).toBe('Chamado ou usuário não encontrado.');
    expect(assignResponsibleErrorMessage(assignError(409))).toBe(TICKET_ASSIGN_CONFLICT_MESSAGE);
    expect(assignResponsibleErrorMessage(assignError(500))).toBe('Erro ao atribuir o responsável.');
  });

  it('lets a screen replace the sentence of one status and keeps the others', () => {
    const overrides = { 409: 'Não foi possível atribuir o responsável — tente novamente.' };

    expect(assignResponsibleErrorMessage(assignError(409), overrides)).toBe('Não foi possível atribuir o responsável — tente novamente.');
    expect(assignResponsibleErrorMessage(assignError(403), overrides)).toBe('Você não tem permissão para atribuir o responsável deste chamado.');
  });

  it('prefers the message in the API body', () => {
    expect(assignResponsibleErrorMessage(assignError(409, { detail: 'O chamado já foi encerrado.' }))).toBe('O chamado já foi encerrado.');
  });

  it('keeps the conflict sentence the screens showed', () => {
    expect(TICKET_ASSIGN_CONFLICT_MESSAGE)
      .toBe('Não foi possível atribuir — o chamado pode já ter outro responsável ou ter mudado de status. Tente novamente.');
  });
});
