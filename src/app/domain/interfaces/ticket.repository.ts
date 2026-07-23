import { Observable } from 'rxjs';
import { CreateTicketData, Ticket, UpdateTicketData } from '../models/ticket.model';
import { Result } from '../models/result.model';

/** Contrato do repositório de tickets. */
export abstract class TicketRepository {
    abstract create(data: CreateTicketData): Observable<Result<string>>;
    abstract update(ticketId: string, data: UpdateTicketData): Observable<Result<void>>;
    abstract reopen(ticketId: string): Observable<Result<void>>;
    abstract delete(ticketId: string): Observable<Result<void>>;
    abstract getByUser(userId: string): Observable<Result<Ticket[]>>;
}
