import { signalStore, withProps, withComputed, withMethods } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService, TICKETS_MANAGE_PERMISSION, extractErrorMessage } from '../../shared';

/**
 * Store dos responsáveis elegíveis (GET /tickets/assignees) pros filtros de responsável do Início
 * e do Monitor: quem tem `tickets:manage` escolhe qualquer pessoa da equipe, sem precisar de
 * `users:read`. Busca uma vez por sessão (a lista muda pouco); sem a permissão, não pergunta à API.
 */
export const TicketAssigneesStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    /** Acesso HTTP aos chamados (GET /tickets/assignees). */
    _ticketDataService: inject(TicketDataService),
    /** Sessão atual, pra só buscar com `tickets:manage`. */
    _session: inject(SessionService)
  })),
  withProps((store) => ({
    /** Responsáveis elegíveis (GET /tickets/assignees), buscados só com `tickets:manage`. */
    _listResource: rxResource({
      params: () => (store._session.hasPermission(TICKETS_MANAGE_PERMISSION) ? true : undefined),
      stream: () => store._ticketDataService.getAssignees()
    })
  })),
  withComputed((store) => ({
    /** Responsáveis elegíveis em ordem de nome (vazio enquanto carrega ou em erro). */
    assignees: computed(() => store._listResource.hasValue() ? store._listResource.value().items : []),
    /** Quantos responsáveis elegíveis existem no total (pode ser mais que a página carregada). */
    total: computed(() => store._listResource.hasValue() ? store._listResource.value().totalCount : 0),
    /** A lista está carregando. */
    loading: computed(() => store._listResource.isLoading()),
    /** Erro ao carregar a lista. */
    error: computed(() => store._listResource.error()
      ? extractErrorMessage(store._listResource.error() as HttpErrorResponse, {}, 'Não foi possível carregar a lista de responsáveis.')
      : null)
  })),
  withMethods((store) => ({
    /** "Tentar novamente" da lista. */
    reload(): void {
      store._listResource.reload();
    }
  }))
);
