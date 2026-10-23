import { signalStore, withProps, withComputed } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage, SessionService } from '../../shared';

/**
 * Store do resumo de tickets do PRÓPRIO usuário logado, por prioridade e status, para o gráfico
 * do dashboard (GET /tickets/mine/summary) — reintroduzido para comparar com o gráfico de volume
 * por período que o substituiu. Só busca depois que há um usuário logado.
 */
export const TicketPersonalSummaryStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _sessionService: inject(SessionService)
  })),
  withProps((store) => ({
    _summaryResource: rxResource({
      params: () => store._sessionService.userId() ?? undefined,
      stream: () => store._ticketDataService.getMySummary()
    })
  })),
  withComputed((store) => ({
    /** Quantidades de tickets do usuário logado, por combinação de prioridade e status. */
    counts: computed(() => store._summaryResource.value() ?? []),
    /** Estado do carregamento do resumo pessoal: carregando e erro. */
    state: computed(() => {
      const error = store._summaryResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._summaryResource.isLoading(),
        error: error ? extractErrorMessage(error, {}, 'Erro ao carregar seu resumo de tickets') : null
      };
    })
  }))
);
