import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { TicketRepository } from '../../domain/interfaces/ticket.repository';
import { CreateTicketData, Ticket, UpdateTicketData } from '../../domain/models/ticket.model';
import { TicketStatus } from '../../domain/enums/ticket-status.enum';
import { SessionService } from '../../core/services/session.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

/** Serviço para gerenciamento de tickets do usuário logado. */
@Injectable({
    providedIn: 'root'
})
export class TicketsService {
    private readonly ticketRepository = inject(TicketRepository);
    private readonly session = inject(SessionService);

    state = signal({
        data: [] as Ticket[],
        loading: false,
        error: null as string | null
    });

    /** Lista de tickets carregada por {@link loadForCurrentUser}. */
    readonly tickets = computed(() => this.state().data);

    /** Quantidade de tickets por status, derivada da lista atual. */
    readonly total = computed(() => this.tickets().length);
    readonly openCount = computed(() => this.countByStatus(TicketStatus.Open));
    readonly inProgressCount = computed(() => this.countByStatus(TicketStatus.InProgress));
    readonly resolvedCount = computed(() => this.countByStatus(TicketStatus.Resolved));

    private countByStatus(status: TicketStatus): number {
        return this.tickets().filter(ticket => ticket.status === status).length;
    }

    /** Busca os tickets do usuário logado na API e atualiza {@link tickets}. */
    loadForCurrentUser() {
        const userId = this.session.userId();
        if (!userId) {
            return;
        }

        this.state.update(s => ({ ...s, loading: true, error: null }));

        this.ticketRepository.getByUser(userId)
            .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.state.update(s => ({ ...s, data: res.value }));
                    } else {
                        this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar tickets' }));
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const message = extractErrorMessage(err, {}, 'Não foi possível carregar os tickets.');
                    this.state.update(s => ({ ...s, error: message }));
                }
            });
    }

    /** Abre um novo ticket e, se der certo, recarrega a lista. */
    create(data: CreateTicketData, onSuccess?: () => void) {
        this.ticketRepository.create(data).subscribe(res => {
            if (res.isSuccess) {
                this.loadForCurrentUser();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao abrir o ticket' }));
            }
        });
    }

    /** Atualiza descrição/status de um ticket e, se der certo, recarrega a lista. */
    update(ticketId: string, data: UpdateTicketData) {
        this.ticketRepository.update(ticketId, data).subscribe(res => {
            if (res.isSuccess) this.loadForCurrentUser();
        });
    }

    /** Reabre um ticket inativo e, se der certo, recarrega a lista. */
    reopen(ticketId: string) {
        this.ticketRepository.reopen(ticketId).subscribe(res => {
            if (res.isSuccess) this.loadForCurrentUser();
        });
    }

    /** Exclui (soft-delete) um ticket e, se der certo, recarrega a lista. */
    remove(ticketId: string) {
        this.ticketRepository.delete(ticketId).subscribe(res => {
            if (res.isSuccess) this.loadForCurrentUser();
        });
    }
}
