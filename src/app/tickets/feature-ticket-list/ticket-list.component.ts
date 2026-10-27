import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketsStore } from '../application/tickets.store';
import { Ticket } from '../entities/ticket';
import { TicketStatus, TICKET_ACTIVE_STATUSES, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { ConfirmDialogService, ToastService } from '../../shared';
import { DropdownFixedPositionDirective } from '../../shared/ui/directives/dropdown-fixed-position.directive';
import { TicketEditDialogComponent } from '../ui/ticket-edit-dialog/ticket-edit-dialog.component';

/** Tela de listagem dos tickets do usuário logado. */
@Component({
    selector: 'app-ticket-list',
    imports: [CommonModule, RouterLink, DropdownFixedPositionDirective, TicketEditDialogComponent],
    templateUrl: './ticket-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
    protected readonly store = inject(TicketsStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly toastService = inject(ToastService);

    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;
    readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;

    /** Opções de itens por página no rodapé da listagem. */
    readonly pageSizeOptions = [10, 20, 50];

    /** Ticket em edição no modal de descrição (null quando o modal está fechado). */
    editingTicket = signal<Ticket | null>(null);

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

    /** Só um ticket ativo (Aberto/Em Andamento) pode ter a descrição editada ou ser cancelado. */
    isActive(ticket: Ticket): boolean {
        return TICKET_ACTIVE_STATUSES.has(ticket.status);
    }

    /** Indica se o ticket tem uma edição, cancelamento, reabertura ou exclusão em andamento — trava os botões da linha. */
    isPending(ticket: Ticket): boolean {
        return this.store.pendingTicketIds().includes(ticket.id);
    }

    /** Reabre o ticket selecionado. */
    onReopen(ticket: Ticket): void {
        this.store.reopen(ticket.id);
    }

    /** Abre o modal de edição da descrição para o ticket selecionado. */
    onStartEdit(ticket: Ticket): void {
        this.editingTicket.set(ticket);
    }

    /** Fecha o modal de edição sem salvar. */
    onEditClosed(): void {
        this.editingTicket.set(null);
    }

    /** Salva a descrição editada no modal, mantendo o status atual do ticket. */
    onEditSave(description: string): void {
        const ticket = this.editingTicket();
        if (!ticket) return;

        this.store.update(ticket.id, { description, status: ticket.status }, () => {
            this.toastService.show('Descrição atualizada.');
            this.editingTicket.set(null);
        });
    }

    /** Confirma e cancela o ticket selecionado, preservando a descrição atual. */
    onCancelTicket(ticket: Ticket): void {
        this.confirmDialogService.confirm({
            title: `Cancelar o ticket "${ticket.title}"?`,
            message: 'O chamado passa para o status Cancelado e some da fila de atendimento — diferente de excluir, o histórico continua disponível e dá pra reabrir depois.',
            confirmLabel: 'Cancelar ticket',
            // "Cancelar" ao lado de "Cancelar ticket" deixava ambíguo qual botão desiste da ação.
            cancelLabel: 'Voltar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) return;

            this.store.update(ticket.id, { description: ticket.description, status: TicketStatus.Canceled }, () => {
                this.toastService.show('Ticket cancelado.');
            });
        });
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
