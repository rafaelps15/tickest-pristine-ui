import { TicketStatus } from '../../domain/enums/ticket-status.enum';

/** Corpo da requisição PUT /tickets/{ticketId}. */
export interface UpdateTicketRequestDto {
    description: string;
    status: TicketStatus;
}
