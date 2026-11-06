import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorStatusMessages, extractErrorMessage } from '../../shared';

/** Mensagens da falha ao ler um chamado (GET /tickets/{id}) que valem em toda tela: sem acesso e chamado removido. */
const TICKET_READ_ERROR_MESSAGES: HttpErrorStatusMessages = {
  403: 'Você não tem acesso a este chamado.',
  404: 'Não encontramos esse chamado — ele pode ter sido removido.'
};

/**
 * Mensagem da falha ao ler um chamado (GET /tickets/{id}): 403 e 404 com as mesmas frases no detalhe e no painel
 * rápido do Monitor; nos outros casos, o texto genérico de cada tela. Usada pela `TicketDetailStore` e pela
 * `TicketQuickInfoStore`.
 */
export function ticketReadErrorMessage(err: HttpErrorResponse, fallback: string): string {
  return extractErrorMessage(err, TICKET_READ_ERROR_MESSAGES, fallback);
}
