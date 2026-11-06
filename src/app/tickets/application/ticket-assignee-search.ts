import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage, termSearchResource } from '../../shared';

/** Quantos candidatos a busca do diálogo "Atribuir responsável" traz por vez. */
const ASSIGNEE_SEARCH_PAGE_SIZE = 8;

/**
 * Busca responsáveis elegíveis pelo nome (GET /tickets/assignees) para o diálogo "Atribuir responsável", como
 * resource do termo: só quem a atribuição aceita (ativo com `tickets:manage`), sem exigir `users:read`; um termo
 * novo cancela a busca anterior. Usada pelos Stores do detalhe, do Monitorar e dos Alertas do Início, cada um com
 * o próprio termo.
 */
export function eligibleAssigneesResource(dataService: TicketDataService, term: () => string) {
  return termSearchResource(term, search =>
    dataService.getAssignees(search, undefined, 1, ASSIGNEE_SEARCH_PAGE_SIZE).pipe(map(page => page.items)));
}

/** Mensagem da falha na busca de responsáveis elegíveis. */
export function assigneeSearchErrorMessage(err: HttpErrorResponse): string {
  return extractErrorMessage(err, { 403: 'Você não tem permissão para buscar responsáveis.' }, 'Erro ao buscar responsáveis.');
}
