import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TicketAttachment, TicketAttachmentPolicy } from '../entities/ticket-attachment';
import { CursorPage, PageCursor, cursorPageParams } from '../../shared';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos anexos de ticket (listagem, upload, download e exclusão). */
@Injectable({ providedIn: 'root' })
export class TicketAttachmentDataService {
  /** Cliente HTTP do Angular. */
  private readonly http = inject(HttpClient);
  /** URL base da API (os anexos ficam em /tickets/{id}/attachments e /ticket-attachments). */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Busca uma página dos anexos de um ticket, do mais novo para o mais antigo (GET /tickets/{ticketId}/attachments).
   * Sem cursor, devolve a primeira página; com o cursor da página anterior, devolve a seguinte.
   */
  getAll(ticketId: string, cursor?: PageCursor, pageSize?: number): Observable<CursorPage<TicketAttachment>> {
    return this.http.get<CursorPage<TicketAttachment>>(`${this.apiUrl}/tickets/${ticketId}/attachments`, { params: cursorPageParams(cursor, pageSize) });
  }

  /** Busca os limites e os tipos aceitos nos anexos (GET /ticket-attachments/policy). */
  getPolicy(): Observable<TicketAttachmentPolicy> {
    return this.http.get<TicketAttachmentPolicy>(`${this.apiUrl}/ticket-attachments/policy`);
  }

  /** Envia um novo anexo pro ticket (POST /tickets/{ticketId}/attachments, multipart/form-data). */
  upload(ticketId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string>(`${this.apiUrl}/tickets/${ticketId}/attachments`, formData);
  }

  /** Baixa o conteúdo de um anexo (GET /ticket-attachments/{id}/download). */
  download(attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ticket-attachments/${attachmentId}/download`, { responseType: 'blob' });
  }

  /** Exclui um anexo (DELETE /ticket-attachments/{id}). */
  delete(attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ticket-attachments/${attachmentId}`);
  }
}
