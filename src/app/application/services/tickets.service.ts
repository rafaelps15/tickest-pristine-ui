import { inject, Injectable, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { TicketRepository } from '../../domain/interfaces/ticket.repository';
import { CreateTicketData, Ticket, UpdateTicketData } from '../../domain/models/ticket.model';
import { TicketStatus } from '../../domain/enums/ticket-status.enum';
import { SessionService } from '../../core/services/session.service';

/** Serviço para gerenciamento de tickets do usuário logado. */
@Injectable({
    providedIn: 'root'
})
export class TicketsService {
    private readonly ticketRepository = inject(TicketRepository);
    private readonly session = inject(SessionService);

    /**
     * Resource de leitura (GET /tickets/users/{userId}) — `params` reativo ao usuário logado:
     * refaz a busca sozinho se o userId mudar (ex: troca de sessão), sem precisar de efeitos manuais.
     */
    private readonly listResource = rxResource({
        params: () => this.session.userId() ?? undefined,
        stream: ({ params }) => this.ticketRepository.getByUser(params)
    });

    /** Erro de uma mutação (create/update/reopen/delete); a leitura tem o próprio erro, vindo do resource. */
    private readonly mutationError = signal<string | null>(null);

    state = computed(() => {
        const result = this.listResource.value();
        const readError = result && !result.isSuccess
            ? (result.error?.message ?? 'Erro ao carregar tickets')
            : null;

        return {
            data: result?.isSuccess ? result.value : [] as Ticket[],
            loading: this.listResource.isLoading(),
            error: this.mutationError() ?? readError
        };
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
        this.mutationError.set(null);
        this.listResource.reload();
    }

    /** Abre um novo ticket e, se der certo, recarrega a lista. */
    create(data: CreateTicketData, onSuccess?: () => void) {
        this.ticketRepository.create(data).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao abrir o ticket');
            }
        });
    }

    /** Atualiza descrição/status de um ticket e, se der certo, recarrega a lista. */
    update(ticketId: string, data: UpdateTicketData) {
        this.ticketRepository.update(ticketId, data).subscribe(res => {
            if (res.isSuccess) this.listResource.reload();
        });
    }

    /** Reabre um ticket inativo e, se der certo, recarrega a lista. */
    reopen(ticketId: string) {
        this.ticketRepository.reopen(ticketId).subscribe(res => {
            if (res.isSuccess) this.listResource.reload();
        });
    }

    /** Exclui (soft-delete) um ticket e, se der certo, recarrega a lista. */
    remove(ticketId: string) {
        this.ticketRepository.delete(ticketId).subscribe(res => {
            if (res.isSuccess) this.listResource.reload();
        });
    }
}
