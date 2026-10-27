import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage } from '../../shared';

/**
 * Store do painel "Informações do Ticket" de Monitorar Tickets: busca só a descrição completa do
 * ticket selecionado (GET /tickets/{id}) — os demais campos do painel vêm direto da linha já
 * carregada na tabela (`TicketMonitorStore.tickets()`), sem duplicar aquela busca. Store própria,
 * e não a `TicketDetailStore` da tela de detalhe completo: são usos diferentes do mesmo dado — aqui
 * é só um complemento rápido, sem as mutações de atribuição que a tela de detalhe tem. Trocar a
 * seleção rápido cancela a busca anterior automaticamente (o `rxResource` troca de observable a
 * cada mudança do `ticketId`, como um `switchMap`).
 */
export const TicketQuickInfoStore = signalStore(
  { providedIn: 'root' },
  withState({
    ticketId: undefined as string | undefined
  }),
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
    /** Detalhe completo do ticket selecionado — hoje, só a descrição é usada (o resto já vem da linha da tabela). */
    ticket: computed(() => store._detailResource.value()),
    /** Estado da busca da descrição: carregando e erro, sem travar o resto do painel (que já tem os outros campos). */
    state: computed(() => {
      const resourceError = store._detailResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._detailResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {
          403: 'Você não tem acesso a este chamado.',
          404: 'Não encontramos esse chamado — ele pode ter sido removido.'
        }, 'Erro ao carregar os detalhes do chamado') : null
      };
    })
  })),
  withMethods((store) => ({
    /** Define o ticket selecionado no painel; `undefined` limpa o painel, sem nenhuma busca em andamento. */
    select(ticketId: string | undefined): void {
      patchState(store, { ticketId });
    }
  }))
);
