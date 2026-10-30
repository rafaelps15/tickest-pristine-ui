import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed, linkedSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatsQuery } from '../entities/ticket-stats-query';
import { TicketDashboardOverview, TicketDashboardScope } from '../entities/ticket-dashboard';
import { TicketVolumeGrouping } from '../entities/ticket-volume';
import { TicketAverageTimes } from '../entities/ticket-average-times';
import { DASHBOARD_FEATURES, SessionService, extractErrorMessage, isoRangeDays, previousIsoRange } from '../../shared';

/** Mensagem de erro de leitura de um widget, com o texto da API quando ela manda. */
function widgetError(error: unknown, fallback: string): string | null {
  return error ? extractErrorMessage(error as HttpErrorResponse, {}, fallback) : null;
}

/** Máximo de pontos que o gráfico de volume aceita (GET /tickets/stats/volume, spec 028, DEC-6). */
const VOLUME_MAX_POINTS = 366;

/**
 * Agrupamentos que cabem no período do recorte: dia a dia num período de mais de 366 dias passa do
 * limite de pontos do back-end (o mesmo vale pra semana em mais de 366 semanas). Sem início, o
 * back-end usa a janela padrão, que sempre cabe; sem fim, o fim é hoje.
 */
function volumeGroupingsThatFit(scope: TicketDashboardScope): TicketVolumeGrouping[] {
  if (!scope.from) return ['Day', 'Week', 'Month'];
  const days = isoRangeDays(scope.from, scope.to ?? new Date().toISOString().slice(0, 10));
  const fits: TicketVolumeGrouping[] = [];
  if (days <= VOLUME_MAX_POINTS) fits.push('Day');
  if (Math.ceil(days / 7) + 1 <= VOLUME_MAX_POINTS) fits.push('Week');
  fits.push('Month');
  return fits;
}

/** O agrupamento pedido, ou o menor que cabe no período quando o pedido passa do limite de pontos. */
function fittingGrouping(groupBy: TicketVolumeGrouping, scope: TicketDashboardScope): TicketVolumeGrouping {
  const fits = volumeGroupingsThatFit(scope);
  return fits.includes(groupBy) ? groupBy : fits[0];
}

/** Se dois recortes pedem exatamente os mesmos chamados (a ordem dos setores importa pouco, mas vem estável da barra). */
function sameScope(a: TicketDashboardScope, b: TicketDashboardScope): boolean {
  return a.priority === b.priority && a.assignee === b.assignee && a.assignedToUserId === b.assignedToUserId
    && a.from === b.from && a.to === b.to && (a.sectorIds ?? []).join() === (b.sectorIds ?? []).join();
}

/** Escopo do gráfico principal do Início: a empresa toda ou o recorte dos filtros. */
export type TicketDashboardChartScope = 'company' | 'filtered';

/**
 * Store dos widgets operacionais do Início pra quem atende a fila (`tickets:manage`): o agregado
 * (Volume, SLA e Central de atenção numa chamada, GET /tickets/stats/overview), os tempos médios
 * (GET /tickets/stats/times) e o gráfico Criados x Resolvidos do recorte (GET /tickets/stats/volume),
 * todos com o mesmo recorte. Cada um tem o seu `rxResource`: carrega, falha e se recupera sozinho, e
 * trocar o recorte cancela as requisições em voo. Todo número vem do servidor. Cada leitura só sai
 * com a sua flag em `DASHBOARD_FEATURES` ligada, que acompanha a liberação de cada rota no ambiente.
 */
export const TicketDashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    scope: {} as TicketDashboardScope,
    /** Agrupamento do gráfico Criados x Resolvidos. */
    groupBy: 'Day' as TicketVolumeGrouping,
    /** Escopo do gráfico principal; o volume do recorte só é pedido em "filtered". */
    chartScope: 'company' as TicketDashboardChartScope,
    /**
     * A tela ainda não sabe o recorte (um departamento da URL esperando a lista): as buscas ficam
     * paradas, em vez de sair com o recorte vazio ou o da visita anterior e ser canceladas depois.
     */
    scopeHeld: false
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _session: inject(SessionService),
    _features: inject(DASHBOARD_FEATURES)
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
    const allowed = () => store._session.hasPermission('tickets:manage') && !store.scopeHeld();
    /** Agregado liberado: permissão e a rota já entregue pelo back-end (flag). */
    const overviewOn = () => allowed() && store._features.operationOverview;

    return {
      // Volume, SLA e atenção contam os chamados abertos no período.
      _overviewResource: rxResource({
        params: () => {
          const query = overviewOn() ? base() : null;
          return query ? { ...query, createdFrom: store.scope().from, createdTo: store.scope().to } : undefined;
        },
        stream: ({ params }) => store._ticketDataService.getOverview(params)
      }),
      // O mesmo agregado no período anterior de mesmo tamanho, pra comparar ("12 a mais que no período
      // anterior"); só com as duas pontas do período — sem período, não há "anterior".
      _previousOverviewResource: rxResource({
        params: () => {
          const query = overviewOn() ? base() : null;
          const { from, to } = store.scope();
          if (!query || !from || !to) return undefined;
          const previous = previousIsoRange(from, to);
          return { ...query, createdFrom: previous.from, createdTo: previous.to };
        },
        stream: ({ params }) => store._ticketDataService.getOverview(params)
      }),
      // Os tempos médios consideram as conclusões no período (spec 027, DEC-4).
      _timesResource: rxResource({
        params: () => {
          const query = allowed() && store._features.averageTimes ? base() : null;
          return query ? { ...query, resolvedFrom: store.scope().from, resolvedTo: store.scope().to } : undefined;
        },
        stream: ({ params }) => store._ticketDataService.getTimes(params)
      }),
      // O período define o intervalo do gráfico; sem período, as janelas padrão do back-end. Só no
      // escopo "filtered" e com a spec 028 no ar: antes dela, a rota ignora os filtros e devolveria
      // a empresa toda como se fosse o recorte.
      _trendResource: rxResource({
        params: () => {
          const query = allowed() && store._features.volumeResolved && store.chartScope() === 'filtered' ? base() : null;
          return query
            ? { groupBy: fittingGrouping(store.groupBy(), store.scope()), query: { ...query, createdFrom: store.scope().from, createdTo: store.scope().to } }
            : undefined;
        },
        stream: ({ params }) => store._ticketDataService.getVolume(params.groupBy, params.query)
      })
    };
  }),
  withComputed((store) => ({
    /**
     * Agregado do recorte, ou null enquanto a primeira carga não chega. Se uma atualização falha, os
     * números anteriores do mesmo recorte continuam (o erro fica em {@link overviewError}); trocar o
     * recorte zera, pra nunca mostrar números de outro filtro.
     */
    overview: linkedSignal<{ key: string; value: TicketDashboardOverview | null }, TicketDashboardOverview | null>({
      source: () => ({
        key: JSON.stringify(store.scope()),
        value: store._overviewResource.hasValue() ? store._overviewResource.value() : null
      }),
      computation: (current, previous) => current.value ?? (previous && previous.source.key === current.key ? previous.value : null)
    }),
    /** O agregado está carregando. */
    overviewLoading: computed(() => store._overviewResource.isLoading()),
    /** Erro do agregado (vale pros três grupos que dependem dele). */
    overviewError: computed(() => widgetError(store._overviewResource.error(), 'Não foi possível carregar os números da operação.')),

    /**
     * Agregado do período anterior, pra comparação; null sem período fechado, enquanto carrega ou
     * em erro (a comparação some, os números do período continuam).
     */
    previousOverview: computed(() => store._previousOverviewResource.hasValue() ? store._previousOverviewResource.value() : null),

    /** Tempos médios do recorte, ou null; como o agregado, uma atualização que falha mantém os anteriores do mesmo recorte. */
    times: linkedSignal<{ key: string; value: TicketAverageTimes | null }, TicketAverageTimes | null>({
      source: () => ({
        key: JSON.stringify(store.scope()),
        value: store._timesResource.hasValue() ? store._timesResource.value() : null
      }),
      computation: (current, previous) => current.value ?? (previous && previous.source.key === current.key ? previous.value : null)
    }),
    /** Os tempos médios estão carregando. */
    timesLoading: computed(() => store._timesResource.isLoading()),
    /** Erro dos tempos médios. */
    timesError: computed(() => widgetError(store._timesResource.error(), 'Não foi possível carregar os tempos de atendimento.')),

    /** Agrupamento efetivo do gráfico do recorte: o escolhido, ou o menor que cabe num período longo. */
    trendGroupBy: computed(() => fittingGrouping(store.groupBy(), store.scope())),
    /** Agrupamentos que não cabem no período do recorte (o botão fica indisponível). */
    unavailableGroupings: computed((): TicketVolumeGrouping[] => {
      const fits = volumeGroupingsThatFit(store.scope());
      return (['Day', 'Week', 'Month'] as TicketVolumeGrouping[]).filter(option => !fits.includes(option));
    }),
    /** Pontos do gráfico Criados x Resolvidos, do mais antigo pro mais novo (vazio enquanto não há resposta). */
    trend: computed(() => store._trendResource.hasValue() ? store._trendResource.value() : []),
    /** Já chegou o volume do recorte (numa recarga, os pontos anteriores continuam). */
    trendHasValue: computed(() => store._trendResource.hasValue()),
    /** O gráfico está carregando. */
    trendLoading: computed(() => store._trendResource.isLoading()),
    /** Erro do gráfico. */
    trendError: computed(() => widgetError(store._trendResource.error(), 'Não foi possível carregar o volume de chamados.'))
  })),
  withComputed((store) => ({
    /** Volume do recorte, ou null. */
    volume: computed(() => store.overview()?.volume ?? null),
    /** SLA do recorte, ou null. */
    sla: computed(() => store.overview()?.sla ?? null),
    /** Central de atenção do recorte, ou null. */
    attention: computed(() => store.overview()?.attention ?? null),
    /** O agregado falhou e não há números anteriores pra mostrar (os grupos mostram o erro). */
    overviewFailed: computed(() => store.overviewError() !== null && store.overview() === null),
    /** A última atualização do agregado falhou, mas os números anteriores continuam na tela (velhos). */
    overviewStale: computed(() => store.overviewError() !== null && store.overview() !== null),
    /** Os tempos falharam e não há tempos anteriores pra mostrar. */
    timesFailed: computed(() => store.timesError() !== null && store.times() === null),
    /** A última atualização dos tempos falhou, mas os anteriores continuam na tela (velhos). */
    timesStale: computed(() => store.timesError() !== null && store.times() !== null)
  })),
  withMethods((store) => ({
    /** Troca o recorte de todos os widgets (vindo dos filtros da URL); recorte igual não refaz nada. */
    setScope(scope: TicketDashboardScope): void {
      if (store.scopeHeld()) patchState(store, { scopeHeld: false });
      if (sameScope(store.scope(), scope)) return;
      patchState(store, { scope: { ...scope } });
    },

    /** Segura as buscas até a tela saber o recorte (o próximo {@link setScope} solta). */
    holdScope(): void {
      patchState(store, { scopeHeld: true });
    },

    /** Troca o escopo do gráfico principal (empresa toda ou recorte dos filtros). */
    setChartScope(chartScope: TicketDashboardChartScope): void {
      patchState(store, { chartScope });
    },

    /** Atualização automática ou manual: recarrega só o que está ligado, mantendo os números na tela. */
    refresh(): void {
      store._overviewResource.reload();
      store._previousOverviewResource.reload();
      store._timesResource.reload();
      store._trendResource.reload();
    },

    /** Muda o agrupamento do gráfico (dia/semana/mês). */
    setGroupBy(groupBy: TicketVolumeGrouping): void {
      patchState(store, { groupBy });
    },

    /** "Tentar novamente" do agregado (Volume, SLA e Central de atenção). */
    reloadOverview(): void {
      store._overviewResource.reload();
      store._previousOverviewResource.reload();
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
