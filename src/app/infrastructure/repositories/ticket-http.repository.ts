import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { TicketRepository } from '../../domain/interfaces/ticket.repository';
import { Ticket } from '../../domain/models/ticket.model';
import { TicketStatus } from '../../domain/enums/ticket-status.enum';

import { ApiResultDto } from '../dtos/api-result.dto';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de tickets. */
@Injectable({
    providedIn: 'root'
})
export class TicketHttpRepository extends TicketRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/tickets`;

    getDashBoardTickets() {
        return this.http
            .get<ApiResultDto<Ticket[]>>(`${this.apiUrl}/dashboard`)
            .pipe(map(result => result.value));
    }

    getTickeMessages(ticketId: number) {
        return this.http
            .get<ApiResultDto<unknown[]>>(`${this.apiUrl}/${ticketId}/messages`)
            .pipe(map(result => result.value));
    }

    updateTicketStatus(id: number, status: TicketStatus) {
        return this.http
            .put<ApiResultDto<void>>(`${this.apiUrl}/${id}/status`, { status })
            .pipe(map(toResult));
    }
}
