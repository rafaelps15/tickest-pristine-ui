import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage } from '../../shared';

/** Store do detalhe de um ticket, carregado pelo id (GET /tickets/{id}). */
export const TicketDetailStore = signalStore(
  { providedIn: 'root' },
  withState({ ticketId: undefined as string | undefined }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService)
  })),
  withProps((store) => ({
    _detailResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => store._ticketDataService.getById(params)
    })
  })),
  withComputed((store) => ({
    /** Detalhe do ticket atual, ou indefinido enquanto carrega ou quando houve erro. */
    ticket: computed(() => store._detailResource.value()),
    /** Estado do carregamento do detalhe: carregando e erro (com mensagens próprias para 404 e 403). */
    state: computed(() => {
      const resourceError = store._detailResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._detailResource.isLoading(),
        error: resourceError
          ? extractErrorMessage(resourceError, {
              403: 'Você não tem acesso a este ticket.',
              404: 'Não encontramos esse ticket — ele pode ter sido removido.'
            }, 'Erro ao carregar o ticket')
          : null
      };
    })
  })),
  withMethods((store) => ({
    /** Define o ticket a exibir, disparando o carregamento do detalhe. */
    loadTicket(ticketId: string): void {
      if (store.ticketId() === ticketId) {
        store._detailResource.reload();
        return;
      }
      patchState(store, { ticketId });
    }
  }))
);
