import { TicketPriority } from '../../domain/enums/ticket-priority.enum';
import { TicketStatus } from '../../domain/enums/ticket-status.enum';

/** Corpo de resposta de GET /tickets/users/{userId} (item da lista). */
export interface TicketResponseDto {
    id: string;
    title: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    openedByUserId: string;
    assignedToUserId: string | null;
}
