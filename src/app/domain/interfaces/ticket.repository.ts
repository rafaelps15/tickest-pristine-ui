import { Observable } from 'rxjs';
import { Ticket } from '../../domain/models/ticket.model';
import { TicketStatus } from '../../domain/enums/ticket-status.enum';
import { Result } from '../models/result.model';

/** Contrato do repositório de tickets. */
export abstract class TicketRepository {
    abstract getDashBoardTickets(): Observable<Ticket[]>;
    abstract getTickeMessages(ticketId: number): Observable<unknown[]>;
    abstract updateTicketStatus(id: number, status: TicketStatus): Observable<Result<void>>;
}

