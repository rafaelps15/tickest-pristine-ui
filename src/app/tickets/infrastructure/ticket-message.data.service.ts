import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TicketMessage } from '../entities/ticket-message';
import { CursorPage, PageCursor, cursorPageParams } from '../../shared';
import { environment } from '../../../environments/environment';

/** Acesso HTTP às mensagens de um ticket (listagem, publicação, edição e exclusão). */
@Injectable({ providedIn: 'root' })
export class TicketMessageDataService {
  /** Cliente HTTP do Angular. */
  private readonly http = inject(HttpClient);
  /** URL base da API (as mensagens ficam em /tickets/{id}/messages e /ticket-messages). */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Busca uma página das mensagens de um ticket, da mais recente para a mais antiga
   * (GET /tickets/{ticketId}/messages). Sem cursor, devolve a primeira página; com o cursor da
   * página anterior, devolve a seguinte.
   */
  getAll(ticketId: string, cursor?: PageCursor, pageSize?: number): Observable<CursorPage<TicketMessage>> {
    return this.http.get<CursorPage<TicketMessage>>(`${this.apiUrl}/tickets/${ticketId}/messages`, { params: cursorPageParams(cursor, pageSize) });
  }

  /** Publica uma nova mensagem no ticket (POST /tickets/{ticketId}/messages) — pode concluir a primeira resposta de SLA. */
  post(ticketId: string, content: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/tickets/${ticketId}/messages`, { content });
  }

  /** Edita o conteúdo de uma mensagem já publicada (PUT /ticket-messages/{id}) — só quem a escreveu pode editar. */
  edit(messageId: string, content: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/ticket-messages/${messageId}`, { content });
  }

  /** Exclui uma mensagem (DELETE /ticket-messages/{id}) — quem a escreveu, ou quem administra chamados. */
  delete(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ticket-messages/${messageId}`);
  }
}
