import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, forkJoin, of } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketCountQuery } from '../entities/ticket-count-query';
import { TicketDashboardAttention, TicketDashboardScope, TicketDashboardSla, TicketDashboardVolume } from '../entities/ticket-dashboard';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService, extractErrorMessage } from '../../shared';

/** Status que contam como "ativo" (o relógio do SLA corre). */
const ACTIVE: TicketStatus[] = [TicketStatus.Open, TicketStatus.InProgress];

/** Mensagem de erro de leitura de um widget, com o texto da API quando ela manda. */
function widgetError(error: unknown, fallback: string): string | null {
  return error ? extractErrorMessage(error as HttpErrorResponse, {}, fallback) : null;
}

/**
 * Store dos widgets operacionais do Início (Volume, SLA e Central de atenção) pra quem atende a
 * fila (`tickets:manage`). Cada widget tem o seu `rxResource`, então carrega, falha e se recupera
 * sozinho. Todos os números são `totalCount` do servidor (GET /tickets com `pageSize=1`), nunca
 * contagem de itens de uma página; trocar o recorte cancela as requisições em voo.
 */
export const TicketDashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    scope: {} as TicketDashboardScope
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _session: inject(SessionService)
  })),
  withProps((store) => {
    /** Filtro base do recorte; `null` quando o recorte não tem como ter chamados (ex.: "meus" sem usuário). */
    const base = (): TicketCountQuery | null => {
      const scope = store.scope();
      const query: TicketCountQuery = { sectorId: scope.sectorId, priority: scope.priority };
      if (scope.assignee === 'none') return { ...query, unassignedOnly: true };
      if (scope.assignee === 'me') {
        const userId = store._session.userId();
        return userId ? { ...query, assignedToUserId: userId } : null;
      }
      return query;
    };

    /** Conta um recorte, ou devolve 0 sem perguntar à API quando o recorte é vazio por definição. */
    const count = (query: TicketCountQuery | null): Observable<number> =>
      query ? store._ticketDataService.count(query) : of(0);

    /** Só pergunta à API com a permissão de ver a fila — sem ela, o resource fica parado (nada de 403 certo). */
    const params = () => (store._session.hasPermission('tickets:manage') ? { scope: store.scope(), base: base() } : undefined);

    return {
      _volumeResource: rxResource({
        params,
        stream: ({ params: p }): Observable<TicketDashboardVolume> => forkJoin({
          total: count(p.base),
          backlog: count(p.base && { ...p.base, statuses: ACTIVE }),
          inProgress: count(p.base && { ...p.base, statuses: [TicketStatus.InProgress] }),
          resolved: count(p.base && { ...p.base, statuses: [TicketStatus.Resolved] }),
          closed: count(p.base && { ...p.base, statuses: [TicketStatus.Closed] })
        })
      }),
      _slaResource: rxResource({
        params,
        stream: ({ params: p }): Observable<TicketDashboardSla> => forkJoin({
          met: count(p.base && { ...p.base, slaStatus: TicketSlaStatus.Met }),
          breached: count(p.base && { ...p.base, slaStatus: TicketSlaStatus.Breached }),
          atRisk: count(p.base && { ...p.base, slaStatus: TicketSlaStatus.AtRisk })
        })
      }),
      _attentionResource: rxResource({
        params,
        stream: ({ params: p }): Observable<TicketDashboardAttention> => {
          // Interseções: com outra prioridade filtrada não há urgentes; com "meus", não há sem responsável.
          const otherPriority = p.scope.priority !== undefined && p.scope.priority !== TicketPriority.Urgent;
          return forkJoin({
            overdue: count(p.base && { ...p.base, slaStatus: TicketSlaStatus.Breached }),
            critical: count(p.base && !otherPriority ? { ...p.base, priority: TicketPriority.Urgent, statuses: ACTIVE } : null),
            unassigned: count(p.base && p.scope.assignee !== 'me'
              ? { sectorId: p.base.sectorId, priority: p.base.priority, unassignedOnly: true, statuses: ACTIVE }
              : null)
          });
        }
      })
    };
  }),
  withComputed((store) => ({
    /** Volume do recorte, ou null enquanto carrega/em erro (hasValue() evita a exceção de value()). */
    volume: computed(() => store._volumeResource.hasValue() ? store._volumeResource.value() : null),
    volumeLoading: computed(() => store._volumeResource.isLoading()),
    volumeError: computed(() => widgetError(store._volumeResource.error(), 'Não foi possível carregar o volume de chamados.')),

    /** SLA do recorte, ou null enquanto carrega/em erro. */
    sla: computed(() => store._slaResource.hasValue() ? store._slaResource.value() : null),
    slaLoading: computed(() => store._slaResource.isLoading()),
    slaError: computed(() => widgetError(store._slaResource.error(), 'Não foi possível carregar o SLA.')),

    /** Central de atenção do recorte, ou null enquanto carrega/em erro. */
    attention: computed(() => store._attentionResource.hasValue() ? store._attentionResource.value() : null),
    attentionLoading: computed(() => store._attentionResource.isLoading()),
    attentionError: computed(() => widgetError(store._attentionResource.error(), 'Não foi possível carregar a central de atenção.'))
  })),
  withMethods((store) => ({
    /** Troca o recorte dos três widgets (vindo dos filtros da URL); recorte igual não refaz nada. */
    setScope(scope: TicketDashboardScope): void {
      const current = store.scope();
      if (current.sectorId === scope.sectorId && current.priority === scope.priority && current.assignee === scope.assignee) return;
      patchState(store, { scope: { ...scope } });
    },

    /** "Tentar novamente" do Volume. */
    reloadVolume(): void {
      store._volumeResource.reload();
    },

    /** "Tentar novamente" do SLA. */
    reloadSla(): void {
      store._slaResource.reload();
    },

    /** "Tentar novamente" da Central de atenção. */
    reloadAttention(): void {
      store._attentionResource.reload();
    }
  }))
);
