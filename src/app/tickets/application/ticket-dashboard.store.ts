import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatsQuery } from '../entities/ticket-stats-query';
import { TicketDashboardScope } from '../entities/ticket-dashboard';
import { TicketVolumeGrouping } from '../entities/ticket-volume';
import { SessionService, extractErrorMessage } from '../../shared';

/** Mensagem de erro de leitura de um widget, com o texto da API quando ela manda. */
function widgetError(error: unknown, fallback: string): string | null {
  return error ? extractErrorMessage(error as HttpErrorResponse, {}, fallback) : null;
}

/** Se dois recortes pedem exatamente os mesmos chamados (a ordem dos setores importa pouco, mas vem estável da barra). */
function sameScope(a: TicketDashboardScope, b: TicketDashboardScope): boolean {
  return a.priority === b.priority && a.assignee === b.assignee && a.assignedToUserId === b.assignedToUserId
    && a.from === b.from && a.to === b.to && (a.sectorIds ?? []).join() === (b.sectorIds ?? []).join();
}

/**
 * Store dos widgets operacionais do Início pra quem atende a fila (`tickets:manage`): o agregado
 * (Volume, SLA e Central de atenção numa chamada, GET /tickets/stats/overview), os tempos médios
 * (GET /tickets/stats/times) e o gráfico Criados x Resolvidos (GET /tickets/stats/volume), todos
 * com o mesmo recorte. Cada um tem o seu `rxResource`: carrega, falha e se recupera sozinho, e
 * trocar o recorte cancela as requisições em voo. Todo número vem do servidor.
 */
export const TicketDashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    scope: {} as TicketDashboardScope,
    /** Agrupamento do gráfico Criados x Resolvidos. */
    groupBy: 'Day' as TicketVolumeGrouping
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _session: inject(SessionService)
  })),
  withProps((store) => {
    /**
     * Recorte em filtros da API, sem o período (cada rota aplica o período a uma data diferente);
     * `null` quando o recorte não tem como ter chamados ("meus" sem usuário logado).
     */
    const base = (): TicketStatsQuery | null => {
      const scope = store.scope();
      const query: TicketStatsQuery = { sectorIds: scope.sectorIds, priority: scope.priority };
      if (scope.assignee === 'none') return { ...query, unassignedOnly: true };
      if (scope.assignee === 'me') {
        const userId = store._session.userId();
        return userId ? { ...query, assignedToUserId: userId } : null;
      }
      return scope.assignedToUserId ? { ...query, assignedToUserId: scope.assignedToUserId } : query;
    };

    /** Só pergunta à API com a permissão de ver a fila e um recorte possível — sem isso, o resource fica parado. */
    const allowed = () => store._session.hasPermission('tickets:manage');

    return {
      // Volume, SLA e atenção contam os chamados abertos no período.
      _overviewResource: rxResource({
        params: () => {
          const query = allowed() ? base() : null;
          return query ? { ...query, createdFrom: store.scope().from, createdTo: store.scope().to } : undefined;
        },
        stream: ({ params }) => store._ticketDataService.getOverview(params)
      }),
      // Os tempos médios consideram as conclusões no período (spec 027, DEC-4).
      _timesResource: rxResource({
        params: () => {
          const query = allowed() ? base() : null;
          return query ? { ...query, resolvedFrom: store.scope().from, resolvedTo: store.scope().to } : undefined;
        },
        stream: ({ params }) => store._ticketDataService.getTimes(params)
      }),
      // O período define o intervalo do gráfico; sem período, as janelas padrão do back-end.
      _trendResource: rxResource({
        params: () => {
          const query = allowed() ? base() : null;
          return query
            ? { groupBy: store.groupBy(), query: { ...query, createdFrom: store.scope().from, createdTo: store.scope().to } }
            : undefined;
        },
        stream: ({ params }) => store._ticketDataService.getVolume(params.groupBy, params.query)
      })
    };
  }),
  withComputed((store) => ({
    /** Agregado do recorte, ou null enquanto carrega/em erro (hasValue() evita a exceção de value()). */
    overview: computed(() => store._overviewResource.hasValue() ? store._overviewResource.value() : null),
    /** Volume do recorte, ou null. */
    volume: computed(() => store._overviewResource.hasValue() ? store._overviewResource.value().volume : null),
    /** SLA do recorte, ou null. */
    sla: computed(() => store._overviewResource.hasValue() ? store._overviewResource.value().sla : null),
    /** Central de atenção do recorte, ou null. */
    attention: computed(() => store._overviewResource.hasValue() ? store._overviewResource.value().attention : null),
    /** O agregado está carregando. */
    overviewLoading: computed(() => store._overviewResource.isLoading()),
    /** Erro do agregado (vale pros três grupos que dependem dele). */
    overviewError: computed(() => widgetError(store._overviewResource.error(), 'Não foi possível carregar os números da operação.')),

    /** Tempos médios do recorte, ou null. */
    times: computed(() => store._timesResource.hasValue() ? store._timesResource.value() : null),
    /** Os tempos médios estão carregando. */
    timesLoading: computed(() => store._timesResource.isLoading()),
    /** Erro dos tempos médios. */
    timesError: computed(() => widgetError(store._timesResource.error(), 'Não foi possível carregar os tempos médios.')),

    /** Pontos do gráfico Criados x Resolvidos, do mais antigo pro mais novo (vazio enquanto não há resposta). */
    trend: computed(() => store._trendResource.hasValue() ? store._trendResource.value() : []),
    /** O gráfico está carregando. */
    trendLoading: computed(() => store._trendResource.isLoading()),
    /** Erro do gráfico. */
    trendError: computed(() => widgetError(store._trendResource.error(), 'Não foi possível carregar o volume de chamados.'))
  })),
  withMethods((store) => ({
    /** Troca o recorte de todos os widgets (vindo dos filtros da URL); recorte igual não refaz nada. */
    setScope(scope: TicketDashboardScope): void {
      if (sameScope(store.scope(), scope)) return;
      patchState(store, { scope: { ...scope } });
    },

    /** Muda o agrupamento do gráfico (dia/semana/mês). */
    setGroupBy(groupBy: TicketVolumeGrouping): void {
      patchState(store, { groupBy });
    },

    /** "Tentar novamente" do agregado (Volume, SLA e Central de atenção). */
    reloadOverview(): void {
      store._overviewResource.reload();
    },

    /** "Tentar novamente" dos tempos médios. */
    reloadTimes(): void {
      store._timesResource.reload();
    },

    /** "Tentar novamente" do gráfico. */
    reloadTrend(): void {
      store._trendResource.reload();
    }
  }))
);
