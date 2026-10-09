import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketMonitorStore } from '../application/ticket-monitor.store';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TicketSortOrder, TICKET_SORT_ORDER_LABELS } from '../entities/ticket-sort-order';
import { DepartmentsStore } from '../../departments';

/** Tela de "Monitorar Tickets": todos os chamados do sistema, com filtros e resumo de SLA (role Administrador/Atendente, permissão tickets:manage). */
@Component({
    selector: 'app-ticket-monitor',
    imports: [CommonModule, RouterLink],
    templateUrl: './ticket-monitor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-monitor.component.css'
})
export class TicketMonitorComponent implements OnInit {
    protected readonly store = inject(TicketMonitorStore);
    protected readonly departmentsStore = inject(DepartmentsStore);

    /** Exposto pro template clicar nos cards de resumo de SLA e filtrar a tabela pelo mesmo valor. */
    protected readonly TicketSlaStatus = TicketSlaStatus;

    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;
    readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
    readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
    readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
    readonly sortOrderLabels = TICKET_SORT_ORDER_LABELS;

    readonly statusOptions = Object.values(TicketStatus).filter((v): v is TicketStatus => typeof v === 'number');
    readonly priorityOptions = Object.values(TicketPriority).filter((v): v is TicketPriority => typeof v === 'number');
    readonly slaStatusOptions = Object.values(TicketSlaStatus).filter((v): v is TicketSlaStatus => typeof v === 'number');
    readonly sortOptions = Object.values(TicketSortOrder).filter((v): v is TicketSortOrder => typeof v === 'number');

    readonly pageSizeOptions = [10, 20, 50];

    /**
     * Carrega a primeira página de tickets e o resumo de SLA ao inicializar. Os departamentos
     * (para o filtro de setor) não são recarregados aqui: o `DepartmentsStore` já os busca
     * sozinho ao ser injetado pela primeira vez na sessão, e esta tela só lê esse dado.
     */
    ngOnInit(): void {
        this.store.load();
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

    /** Muda a quantidade de itens por página. */
    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    /** Indica se o chamado já passou do prazo e ainda não foi resolvido, para destacar a data na tabela. */
    isOverdue(ticket: TicketMonitorItem): boolean {
        return !ticket.resolvedAtUtc && new Date(ticket.dueAtUtc).getTime() < Date.now();
    }
}
