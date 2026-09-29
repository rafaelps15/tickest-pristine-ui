import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTicketData, Ticket, UpdateTicketData } from '../entities/ticket';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos tickets (listagem por usuário, criação, atualização, reabertura e exclusão). */
@Injectable({ providedIn: 'root' })
export class TicketDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tickets`;

  /** Cria um novo ticket (POST /tickets). */
  create(data: CreateTicketData): Observable<string> {
    return this.http.post<string>(this.apiUrl, data);
  }

  /** Atualiza descrição/status de um ticket (PUT /tickets/{id}). */
  update(ticketId: string, data: UpdateTicketData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${ticketId}`, data);
  }

  /** Reabre um ticket inativo (POST /tickets/{id}/reopen). */
  reopen(ticketId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${ticketId}/reopen`, null);
  }

  /** Exclui (soft-delete) um ticket (DELETE /tickets/{id}). */
  delete(ticketId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${ticketId}`);
  }

  /** Busca os tickets de um usuário (GET /tickets/users/{userId}). */
  getByUser(userId: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/users/${userId}`);
  }
}
