import { signalStore, withProps, withComputed, withMethods } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService, extractErrorMessage } from '../../shared';

/**
 * Store dos responsáveis elegíveis (GET /tickets/assignees) pros filtros de responsável do Início
 * e do Monitor: quem tem `tickets:manage` escolhe qualquer pessoa da equipe, sem precisar de
 * `users:read`. Busca uma vez por sessão (a lista muda pouco); sem a permissão, não pergunta à API.
 */
export const TicketAssigneesStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _session: inject(SessionService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => (store._session.hasPermission('tickets:manage') ? true : undefined),
      stream: () => store._ticketDataService.getAssignees().pipe(map(page => page.items))
    })
  })),
  withComputed((store) => ({
    /** Responsáveis elegíveis em ordem de nome (vazio enquanto carrega ou em erro). */
    assignees: computed(() => store._listResource.hasValue() ? store._listResource.value() : []),
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
