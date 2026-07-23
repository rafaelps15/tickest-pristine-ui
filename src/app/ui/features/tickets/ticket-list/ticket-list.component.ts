import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketsService } from '../../../../application/services/tickets.service';
import { Ticket } from '../../../../domain/models/ticket.model';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../../../../domain/enums/ticket-status.enum';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../../../../domain/enums/ticket-priority.enum';

/** Tela de listagem dos tickets do usuário logado. */
@Component({
    selector: 'app-ticket-list',
    imports: [CommonModule, RouterLink],
    templateUrl: './ticket-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
    protected readonly ticketsService = inject(TicketsService);

    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;
    readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;

    ngOnInit(): void {
        this.ticketsService.loadForCurrentUser();
    }

    /** Só faz sentido reabrir um ticket que já está inativo (Resolvido/Fechado/Cancelado). */
    canReopen(ticket: Ticket): boolean {
        return ticket.status === TicketStatus.Resolved
            || ticket.status === TicketStatus.Closed
            || ticket.status === TicketStatus.Canceled;
    }

    onReopen(ticket: Ticket): void {
        this.ticketsService.reopen(ticket.id);
    }

    onDelete(ticket: Ticket): void {
        if (confirm(`Tem certeza que deseja excluir o ticket "${ticket.title}"?`)) {
            this.ticketsService.remove(ticket.id);
        }
    }
}
