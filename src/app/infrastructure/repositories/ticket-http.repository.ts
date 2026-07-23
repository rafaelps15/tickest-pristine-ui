import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TicketRepository } from '../../domain/interfaces/ticket.repository';
import { CreateTicketData, Ticket, UpdateTicketData } from '../../domain/models/ticket.model';

import { CreateTicketRequestDto } from '../dtos/create-ticket-request.dto';
import { UpdateTicketRequestDto } from '../dtos/update-ticket-request.dto';
import { TicketResponseDto } from '../dtos/ticket-response.dto';

import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de tickets. */
@Injectable({
    providedIn: 'root'
})
export class TicketHttpRepository extends TicketRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/tickets`;

    create(data: CreateTicketData) {
        const dto: CreateTicketRequestDto = data;
        return this.http
            .post<string>(this.apiUrl, dto)
            .pipe(toResult());
    }

    update(ticketId: string, data: UpdateTicketData) {
        const dto: UpdateTicketRequestDto = data;
        return this.http
            .put<void>(`${this.apiUrl}/${ticketId}`, dto)
            .pipe(toResult());
    }

    reopen(ticketId: string) {
        return this.http
            .post<void>(`${this.apiUrl}/${ticketId}/reopen`, null)
            .pipe(toResult());
    }

    delete(ticketId: string) {
        return this.http
            .delete<void>(`${this.apiUrl}/${ticketId}`)
            .pipe(toResult());
    }

    getByUser(userId: string) {
        return this.http
            .get<TicketResponseDto[]>(`${this.apiUrl}/users/${userId}`)
            .pipe(toResult<Ticket[]>());
    }
}
