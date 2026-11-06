import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorStatusMessages, extractErrorMessage } from '../../shared';

/** 409 da atribuição (PUT /tickets/{id}/assignee): o chamado ganhou outro responsável ou mudou de status depois da leitura. */
export const TICKET_ASSIGN_CONFLICT_MESSAGE = 'Não foi possível atribuir — o chamado pode já ter outro responsável ou ter mudado de status. Tente novamente.';

/** Mensagens por status da atribuição de um responsável escolhido na busca. */
const ASSIGN_RESPONSIBLE_ERROR_MESSAGES: HttpErrorStatusMessages = {
  403: 'Você não tem permissão para atribuir o responsável deste chamado.',
  404: 'Chamado ou usuário não encontrado.',
  409: TICKET_ASSIGN_CONFLICT_MESSAGE
};

/**
 * Mensagem da falha ao atribuir o responsável escolhido (PUT /tickets/{id}/assignee), a mesma no Monitor, nos
 * Alertas de SLA do Início e no detalhe do chamado. `overrides` troca a frase de algum status: o detalhe tem a
 * própria para o 409.
 */
export function assignResponsibleErrorMessage(err: HttpErrorResponse, overrides: HttpErrorStatusMessages = {}): string {
  return extractErrorMessage(err, { ...ASSIGN_RESPONSIBLE_ERROR_MESSAGES, ...overrides }, 'Erro ao atribuir o responsável.');
}
