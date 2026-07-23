import { TicketPriority } from '../../domain/enums/ticket-priority.enum';

/** Corpo da requisição POST /tickets. */
export interface CreateTicketRequestDto {
    title: string;
    description: string;
    priority: TicketPriority;
    sectorId: string;
    requesterId?: string;
    responsibleId?: string;
}
