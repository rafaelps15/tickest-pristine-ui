import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TicketAttachment } from '../entities/ticket-attachment';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos anexos de ticket (listagem, upload, download e exclusão). */
@Injectable({ providedIn: 'root' })
export class TicketAttachmentDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Lista os anexos de um ticket (GET /tickets/{ticketId}/attachments). */
  getAll(ticketId: string): Observable<TicketAttachment[]> {
    return this.http.get<TicketAttachment[]>(`${this.apiUrl}/tickets/${ticketId}/attachments`);
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
