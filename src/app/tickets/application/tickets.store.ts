import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { CreateTicketData, Ticket, UpdateTicketData } from '../entities/ticket';
import { TicketStatus } from '../entities/ticket-status';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService, extractErrorMessage } from '../../shared';

/** Store de tickets do usuário logado: listagem, criação, atualização, reabertura e exclusão. */
export const TicketsStore = signalStore(
  { providedIn: 'root' },
  withState({ mutationError: null as string | null }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _session: inject(SessionService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => store._session.userId() ?? undefined,
      stream: ({ params }) => store._ticketDataService.getByUser(params)
    })
  })),
  withComputed((store) => ({
    /** Tickets do usuário logado carregados pelo resource de leitura. */
    tickets: computed(() => store._listResource.value() ?? ([] as Ticket[])),
    /** Estado agregado da listagem: dados, carregamento e erro (de leitura ou de mutação). */
    state: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listResource.value() ?? ([] as Ticket[]),
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar tickets')
          : null)
      };
    })
  })),
  withComputed((store) => ({
    /** Total de tickets do usuário logado. */
    total: computed(() => store.tickets().length),
    /** Quantidade de tickets com status Aberto. */
    openCount: computed(() => store.tickets().filter(ticket => ticket.status === TicketStatus.Open).length),
    /** Quantidade de tickets com status Em Andamento. */
    inProgressCount: computed(() => store.tickets().filter(ticket => ticket.status === TicketStatus.InProgress).length),
    /** Quantidade de tickets com status Resolvido. */
    resolvedCount: computed(() => store.tickets().filter(ticket => ticket.status === TicketStatus.Resolved).length)
  })),
  withMethods((store) => ({
    /** Carrega (ou recarrega) os tickets do usuário logado. */
    loadForCurrentUser(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /** Cria um novo ticket e recarrega a listagem em caso de sucesso. */
    create(data: CreateTicketData, onSuccess?: () => void): void {
      store._ticketDataService.create(data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao abrir o ticket') });
        }
      });
    },

    /** Atualiza descrição/status de um ticket existente e recarrega a listagem em caso de sucesso. */
    update(ticketId: string, data: UpdateTicketData): void {
      store._ticketDataService.update(ticketId, data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao atualizar o ticket') });
        }
      });
    },

    /** Reabre um ticket inativo e recarrega a listagem em caso de sucesso. */
    reopen(ticketId: string): void {
      store._ticketDataService.reopen(ticketId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao reabrir o ticket') });
        }
      });
    },

    /** Exclui (soft-delete) um ticket e recarrega a listagem em caso de sucesso. */
    remove(ticketId: string): void {
      store._ticketDataService.delete(ticketId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao excluir o ticket') });
        }
      });
    }
  }))
);
