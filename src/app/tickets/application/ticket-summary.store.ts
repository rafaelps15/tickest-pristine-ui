import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { TicketVolumeGrouping } from '../entities/ticket-volume';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage, SessionService } from '../../shared';

/**
 * Valor do recurso, ou `undefined` sem valor — inclusive em erro. Ler `.value()` direto num
 * `resource()` em estado de erro lança exceção (Angular 20+), e os derivados abaixo são lidos pelo
 * template sempre, mesmo quando ele está mostrando o erro: sem isso, a falha da API quebrava a tela
 * em vez de mostrar "—" / "Tentar novamente".
 */
function valueOf<T>(resource: { hasValue(): boolean; value(): T }): T | undefined {
  return resource.hasValue() ? resource.value() : undefined;
}

/** Quantos chamados críticos de SLA (vencidos + em risco) o card "Alertas de SLA" lista. */
const CRITICAL_TICKETS_LIMIT = 5;

/** Vagas reservadas pros vencidos na lista — as outras ficam pros em risco (se houver), ainda salváveis. */
const BREACHED_RESERVED_SLOTS = 3;

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
    _ticketDataService: inject(TicketDataService),
    _sessionService: inject(SessionService)
  })),
  withProps((store) => ({
    _statusCountsResource: rxResource({
      stream: () => store._ticketDataService.getStatusCounts()
    }),
    _volumeResource: rxResource({
      params: () => store.groupBy(),
      stream: ({ params }) => store._ticketDataService.getVolume(params)
    }),
    /**
     * Chamados com SLA vencido e em risco (até 5 de cada, com o total de cada grupo), pro card "Alertas de SLA" do
     * Dashboard — mesmo endpoint que Monitorar Tickets usa (GET /tickets), que exige a permissão
     * `tickets:manage`. `params` retorna `undefined` pra quem não tem a permissão, o que faz o
     * `rxResource` nem chamar a API (evita um 403 certo pra Solicitante).
     */
    _criticalTicketsResource: rxResource({
      params: () => (store._sessionService.hasPermission('tickets:manage') ? true : undefined),
      // Vencidos (Breached) e em risco (AtRisk) — o filtro da API aceita um status por vez. Antes só
      // AtRisk: os chamados que já estouraram o prazo, os mais graves, ficavam fora do alerta.
      // `slaSummary` só pra ler a hora do servidor (`serverNowUtc`): o prazo relativo do card ("vence em
      // 2h") anda sozinho no navegador, mas ancorado no relógio do servidor, não no da máquina.
      stream: () => forkJoin({
        breached: store._ticketDataService.getAll({ slaStatus: TicketSlaStatus.Breached, sort: TicketSortOrder.DueDate, page: 1, pageSize: CRITICAL_TICKETS_LIMIT }),
        atRisk: store._ticketDataService.getAll({ slaStatus: TicketSlaStatus.AtRisk, sort: TicketSortOrder.DueDate, page: 1, pageSize: CRITICAL_TICKETS_LIMIT }),
        slaSummary: store._ticketDataService.getSlaSummary()
      }).pipe(map(result => ({ ...result, receivedAtMs: Date.now() })))
    })
  })),
  withComputed((store) => ({
    /** Pontos de volume de tickets abertos no período atual (dia/semana/mês), do mais antigo pro mais novo. */
    volume: computed(() => valueOf(store._volumeResource) ?? []),
    /** Carregando os totais por status — só esse recurso, não o volume (os 2 são independentes; trocar o agrupamento do gráfico não deve acender o spinner dos 4 cards de status). */
    statusCountsLoading: computed(() => store._statusCountsResource.isLoading()),
    /** Carregando o volume de tickets do período (dia/semana/mês) — só esse recurso, não os totais por status. */
    volumeLoading: computed(() => store._volumeResource.isLoading()),
    /**
     * A busca dos totais por status falhou — os cards mostram "—" em vez do `0` de fallback, que
     * passaria por dado real ("0 em aberto, tudo certo") quando na verdade a API não respondeu.
     */
    statusCountsFailed: computed(() => !!store._statusCountsResource.error()),
    /** A busca do volume falhou — o gráfico mostra erro em vez do vazio "nenhum ticket", que seria falso. */
    volumeFailed: computed(() => !!store._volumeResource.error()),
    /** Erro de carregamento do resumo (totais por status ou volume) — usado pro alerta de erro no topo, que cobre os dois. */
    summaryError: computed(() => {
      const statusError = store._statusCountsResource.error() as HttpErrorResponse | undefined;
      const volumeError = store._volumeResource.error() as HttpErrorResponse | undefined;
      return statusError
        ? extractErrorMessage(statusError, {}, 'Erro ao carregar o resumo dos chamados')
        : volumeError
          ? extractErrorMessage(volumeError, {}, 'Erro ao carregar o volume de chamados')
          : null;
    })
  })),
  withComputed((store) => ({
    /** Total de tickets da empresa (todos os status, incluindo Fechados e Cancelados). */
    total: computed(() => valueOf(store._statusCountsResource)?.totalCount ?? 0),
    /** Quantidade de tickets com status Aberto, de toda a empresa. */
    openCount: computed(() => valueOf(store._statusCountsResource)?.openCount ?? 0),
    /** Quantidade de tickets com status Em Andamento, de toda a empresa. */
    inProgressCount: computed(() => valueOf(store._statusCountsResource)?.inProgressCount ?? 0),
    /** Quantidade de tickets com status Resolvido, de toda a empresa. */
    resolvedCount: computed(() => valueOf(store._statusCountsResource)?.resolvedCount ?? 0),
    /** Quantidade de tickets com status Fechado, de toda a empresa — não tem card próprio, só explica a diferença entre Total e os 3 cards visíveis. */
    closedCount: computed(() => valueOf(store._statusCountsResource)?.closedCount ?? 0),
    /** Quantidade de tickets com status Cancelado, de toda a empresa — não tem card próprio, só explica a diferença entre Total e os 3 cards visíveis. */
    canceledCount: computed(() => valueOf(store._statusCountsResource)?.canceledCount ?? 0),
    /**
     * Chamados com SLA vencido ou em risco (até 5: até 3 vencidos, do mais antigo, e até 2 em risco, do
     * mais urgente; a sobra de um grupo vai pro outro) — vazio para quem não tem `tickets:manage`.
     */
    criticalTickets: computed(() => {
      const value = valueOf(store._criticalTicketsResource);
      if (!value) return [];
      // Vagas reservadas: até 3 vencidos e até 2 em risco, e a sobra de um grupo vai pro outro. Só
      // por prazo, 5+ vencidos ocupavam a lista toda e o "vence em 1 min" — o único que ainda dá pra
      // salvar — sumia. A API já devolve cada grupo ordenado por prazo.
      const { items: breached } = value.breached;
      const { items: atRisk } = value.atRisk;
      let breachedSlots = Math.min(breached.length, BREACHED_RESERVED_SLOTS);
      const atRiskSlots = Math.min(atRisk.length, CRITICAL_TICKETS_LIMIT - breachedSlots);
      breachedSlots = Math.min(breached.length, CRITICAL_TICKETS_LIMIT - atRiskSlots);
      return [...breached.slice(0, breachedSlots), ...atRisk.slice(0, atRiskSlots)];
    }),
    /** Total de chamados ativos com SLA vencido em toda a empresa (não só os 5 listados). */
    breachedCount: computed(() => valueOf(store._criticalTicketsResource)?.breached.totalCount ?? 0),
    /** Total de chamados ativos com SLA em risco em toda a empresa (não só os 5 listados). */
    atRiskCount: computed(() => valueOf(store._criticalTicketsResource)?.atRisk.totalCount ?? 0),
    /**
     * Diferença (ms) entre o relógio do servidor e o do navegador, medida quando os alertas chegaram —
     * `Date.now() + clockOffsetMs` é a "hora do servidor" usada pelo prazo relativo do card. 0 sem dados.
     */
    clockOffsetMs: computed(() => {
      const value = valueOf(store._criticalTicketsResource);
      return value ? new Date(value.slaSummary.serverNowUtc).getTime() - value.receivedAtMs : 0;
    }),
    /**
     * Primeira carga dos alertas de SLA (ainda sem nada pra mostrar) — numa atualização, a lista
     * atual fica na tela e quem sinaliza a busca é {@link criticalTicketsRefreshing}.
     */
    criticalTicketsLoading: computed(() => store._criticalTicketsResource.isLoading() && !store._criticalTicketsResource.hasValue()),
    /** Atualizando os alertas de SLA com a lista anterior ainda na tela (botão "Atualizar" gira). */
    criticalTicketsRefreshing: computed(() => store._criticalTicketsResource.isLoading() && store._criticalTicketsResource.hasValue()),
    /**
     * Quando os alertas de SLA chegaram (ms, relógio do navegador) — o card mostra "Atualizado às" e
     * decide recarregar ao voltar pra aba. Null sem dados.
     */
    criticalTicketsLoadedAtMs: computed(() => valueOf(store._criticalTicketsResource)?.receivedAtMs ?? null),
    /** Mensagem de erro ao buscar os chamados em risco de SLA — não derruba o resto do dashboard, só esse card. */
    criticalTicketsError: computed(() => {
      const error = store._criticalTicketsResource.error() as HttpErrorResponse | undefined;
      return error ? extractErrorMessage(error, {}, 'Erro ao carregar os alertas de SLA') : null;
    })
  })),
  withMethods((store) => ({
    /** Carrega (ou recarrega) os totais por status e o volume de tickets da empresa. */
    load(): void {
      store._statusCountsResource.reload();
      store._volumeResource.reload();
      store._criticalTicketsResource.reload();
    },

    /**
     * Recarrega só os alertas de SLA ("Atualizar", "Tentar novamente", volta pra aba depois de um
     * tempo) — sem tocar nos totais nem no volume, que piscariam os KPIs e o gráfico à toa.
     */
    reloadCritical(): void {
      store._criticalTicketsResource.reload();
    },

    /** Muda o agrupamento do gráfico de volume (dia/semana/mês). */
    setGroupBy(groupBy: TicketVolumeGrouping): void {
      patchState(store, { groupBy });
    }
  }))
);
