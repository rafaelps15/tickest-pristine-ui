import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketsStore } from '../application/tickets.store';
import { Ticket } from '../entities/ticket';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { ConfirmDialogService } from '../../shared';
import { DropdownFixedPositionDirective } from '../../shared/ui/directives/dropdown-fixed-position.directive';

/** Tela de listagem dos tickets do usuário logado. */
@Component({
    selector: 'app-ticket-list',
    imports: [CommonModule, RouterLink, DropdownFixedPositionDirective],
    templateUrl: './ticket-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
    protected readonly store = inject(TicketsStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);

    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;
    readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;

    /** Opções de itens por página no rodapé da listagem. */
    readonly pageSizeOptions = [10, 20, 50];

    /** Carrega os tickets do usuário logado ao inicializar a tela. */
    ngOnInit(): void {
        this.store.loadForCurrentUser();
    }

    /** Índice (1-based) do primeiro item exibido na página atual, para o texto "Exibindo X–Y de Z". */
    rangeStart(): number {
        return this.store.total() === 0 ? 0 : (this.store.currentPage() - 1) * this.store.currentPageSize() + 1;
    }

    /** Índice (1-based) do último item exibido na página atual, para o texto "Exibindo X–Y de Z". */
    rangeEnd(): number {
        return Math.min(this.store.currentPage() * this.store.currentPageSize(), this.store.total());
    }

    /**
     * Janela de números de página pro rodapé: sempre mostra a primeira, a última e as vizinhas da
     * atual, com "…" nos saltos — pra não listar 1 botão por página quando há muitas.
     */
    pageNumbers(): (number | '…')[] {
        const total = this.store.totalPages();
        const current = this.store.currentPage();

        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        const kept = new Set([1, total, current - 1, current, current + 1]);
        const sorted = Array.from(kept).filter(page => page >= 1 && page <= total).sort((a, b) => a - b);

        const result: (number | '…')[] = [];
        let previous = 0;
        for (const page of sorted) {
            if (previous && page - previous > 1) {
                result.push('…');
            }
            result.push(page);
            previous = page;
        }
        return result;
    }

    /** Troca a quantidade de itens por página, voltando para a primeira. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Só faz sentido reabrir um ticket que já está inativo (Resolvido/Fechado/Cancelado). */
    canReopen(ticket: Ticket): boolean {
        return ticket.status === TicketStatus.Resolved
            || ticket.status === TicketStatus.Closed
            || ticket.status === TicketStatus.Canceled;
    }

    /** Reabre o ticket selecionado. */
    onReopen(ticket: Ticket): void {
        this.store.reopen(ticket.id);
    }

    /** Confirma e exclui o ticket selecionado. */
    onDelete(ticket: Ticket): void {
        this.confirmDialogService.confirm({
            title: `Excluir o ticket "${ticket.title}"?`,
            message: 'Essa ação não pode ser desfeita.',
            confirmLabel: 'Excluir',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.store.remove(ticket.id);
        });
    }
}
