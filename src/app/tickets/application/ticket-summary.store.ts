import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketVolumeGrouping } from '../entities/ticket-volume';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage } from '../../shared';

/**
 * Store do resumo de tickets de toda a empresa, para o dashboard — totais por status e volume de
 * chamados abertos por período (dia/semana/mês). Não filtra por quem abriu: todo usuário logado
 * vê a mesma visão, independente de papel — decisão confirmada do produto, mesmo pra quem tem
 * papel Administrador.
 */
export const TicketSummaryStore = signalStore(
  { providedIn: 'root' },
  withState({
    groupBy: 'Day' as TicketVolumeGrouping
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService)
  })),
  withProps((store) => ({
    _statusCountsResource: rxResource({
      stream: () => store._ticketDataService.getStatusCounts()
    }),
    _volumeResource: rxResource({
      params: () => store.groupBy(),
      stream: ({ params }) => store._ticketDataService.getVolume(params)
    })
  })),
  withComputed((store) => ({
    /** Pontos de volume de tickets abertos no período atual (dia/semana/mês), do mais antigo pro mais novo. */
    volume: computed(() => store._volumeResource.value() ?? []),
    /** Estado do carregamento do resumo: carregando (qualquer um dos dois recursos) e erro. */
    state: computed(() => {
      const statusError = store._statusCountsResource.error() as HttpErrorResponse | undefined;
      const volumeError = store._volumeResource.error() as HttpErrorResponse | undefined;
      const error = statusError
        ? extractErrorMessage(statusError, {}, 'Erro ao carregar o resumo dos tickets')
        : volumeError
          ? extractErrorMessage(volumeError, {}, 'Erro ao carregar o volume de tickets')
          : null;

      return {
        loading: store._statusCountsResource.isLoading() || store._volumeResource.isLoading(),
        error
      };
    })
  })),
  withComputed((store) => ({
    /** Total de tickets da empresa (todos os status, incluindo Fechados e Cancelados). */
    total: computed(() => store._statusCountsResource.value()?.totalCount ?? 0),
    /** Quantidade de tickets com status Aberto, de toda a empresa. */
    openCount: computed(() => store._statusCountsResource.value()?.openCount ?? 0),
    /** Quantidade de tickets com status Em Andamento, de toda a empresa. */
    inProgressCount: computed(() => store._statusCountsResource.value()?.inProgressCount ?? 0),
    /** Quantidade de tickets com status Resolvido, de toda a empresa. */
    resolvedCount: computed(() => store._statusCountsResource.value()?.resolvedCount ?? 0),
    /** Quantidade de tickets com status Fechado, de toda a empresa — não tem card próprio, só explica a diferença entre Total e os 3 cards visíveis. */
    closedCount: computed(() => store._statusCountsResource.value()?.closedCount ?? 0),
    /** Quantidade de tickets com status Cancelado, de toda a empresa — não tem card próprio, só explica a diferença entre Total e os 3 cards visíveis. */
    canceledCount: computed(() => store._statusCountsResource.value()?.canceledCount ?? 0)
  })),
  withMethods((store) => ({
    /** Carrega (ou recarrega) os totais por status e o volume de tickets da empresa. */
    load(): void {
      store._statusCountsResource.reload();
      store._volumeResource.reload();
    },

    /** Muda o agrupamento do gráfico de volume (dia/semana/mês). */
    setGroupBy(groupBy: TicketVolumeGrouping): void {
      patchState(store, { groupBy });
    }
  }))
);
