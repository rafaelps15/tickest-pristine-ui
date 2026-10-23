import { signalStore, withProps, withComputed, withMethods } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage } from '../../shared';

/**
 * Store do resumo de tickets de toda a empresa, para os cards do dashboard — totais por status.
 * Não filtra por quem abriu: todo usuário logado vê a mesma visão, independente de papel.
 *
 * Chegou a ter também o volume de chamados por período (dia/semana/mês), para o gráfico que
 * substituiu o de Prioridade×Status — removido em 2026-10-21 porque o dashboard voltou a usar o
 * gráfico antigo (por usuário, não por empresa) para comparação, e esse recurso ficava buscando
 * `GET /tickets/stats/volume` a cada carregamento sem que nada lesse o resultado. O método
 * `getVolume` continua em `TicketDataService` caso a decisão seja voltar para aquele gráfico.
 */
export const TicketSummaryStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    _ticketDataService: inject(TicketDataService)
  })),
  withProps((store) => ({
    _statusCountsResource: rxResource({
      stream: () => store._ticketDataService.getStatusCounts()
    })
  })),
  withComputed((store) => ({
    /** Estado do carregamento do resumo: carregando e erro. */
    state: computed(() => {
      const statusError = store._statusCountsResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._statusCountsResource.isLoading(),
        error: statusError ? extractErrorMessage(statusError, {}, 'Erro ao carregar o resumo dos tickets') : null
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
    resolvedCount: computed(() => store._statusCountsResource.value()?.resolvedCount ?? 0)
  })),
  withMethods((store) => ({
    /** Carrega (ou recarrega) os totais por status da empresa. */
    load(): void {
      store._statusCountsResource.reload();
    }
  }))
);
