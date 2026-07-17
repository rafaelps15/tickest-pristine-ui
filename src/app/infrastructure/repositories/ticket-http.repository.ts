import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TicketRepository } from '../../domain/interfaces/ticket.repository';
import { Ticket } from '../../domain/models/ticket.model';
import { TicketStatus } from '../../domain/enums/ticket-status.enum';

import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/**
 * Implementação HTTP do repositório de tickets.
 *
 * ATENÇÃO: só a comunicação (envelope de resposta) foi corrigida aqui pra bater com o
 * back-end real. As rotas (`/tickets/dashboard`, `/tickets/{id}/messages`, `/tickets/{id}/status`)
 * e os ids numéricos ainda não foram conferidos contra os endpoints de Tickets do back — isso
 * precisa de uma passada dedicada em Tickets, fora do escopo desta correção (que era sobre Users).
 */
@Injectable({
    providedIn: 'root'
})
export class TicketHttpRepository extends TicketRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/tickets`;

    getDashBoardTickets() {
        return this.http.get<Ticket[]>(`${this.apiUrl}/dashboard`);
    }

    getTickeMessages(ticketId: number) {
        return this.http.get<unknown[]>(`${this.apiUrl}/${ticketId}/messages`);
    }

    updateTicketStatus(id: number, status: TicketStatus) {
        return this.http
            .put<void>(`${this.apiUrl}/${id}/status`, { status })
            .pipe(toResult());
    }
}
