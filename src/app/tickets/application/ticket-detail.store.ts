import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { UserDataService, UserSummary } from '../../users';
import { extractErrorMessage } from '../../shared';

/**
 * Store do detalhe de um ticket, carregado pelo id (GET /tickets/{id}), e das mutações feitas a
 * partir dessa tela — atribuir/remover o responsável, inclusive a busca de usuários candidatos
 * para atribuição (GET /users, da própria tela, sem uma Store de busca reutilizável — ver o método
 * `searchAssignees`).
 */
export const TicketDetailStore = signalStore(
  { providedIn: 'root' },
  withState({
    ticketId: undefined as string | undefined,
    mutationError: null as string | null,
    removingAssignee: false,
    assigningTicket: false,
    assigneeCandidates: [] as UserSummary[],
    searchingAssignees: false,
    assigneeSearchError: null as string | null
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _userDataService: inject(UserDataService)
  })),
  withProps((store) => ({
    _detailResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => store._ticketDataService.getById(params)
    })
  })),
  withComputed((store) => ({
    /** Detalhe do ticket atual, ou indefinido enquanto carrega ou quando houve erro. */
    ticket: computed(() => store._detailResource.value()),
    /** Estado do carregamento do detalhe: carregando e erro (com mensagens próprias para 404 e 403). */
    state: computed(() => {
      const resourceError = store._detailResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._detailResource.isLoading(),
        error: resourceError
          ? extractErrorMessage(resourceError, {
              403: 'Você não tem acesso a este ticket.',
              404: 'Não encontramos esse ticket — ele pode ter sido removido.'
            }, 'Erro ao carregar o ticket')
          : null
      };
    })
  })),
  withMethods((store) => ({
    /** Define o ticket a exibir, disparando o carregamento do detalhe. */
    loadTicket(ticketId: string): void {
      if (store.ticketId() === ticketId) {
        store._detailResource.reload();
        return;
      }
      patchState(store, { ticketId });
    },

    /** Limpa o erro da última mutação (remoção ou atribuição) — ex.: ao abrir o modal de atribuição. */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    },

    /**
     * Remove o responsável atual do ticket e recarrega o detalhe em caso de sucesso — exige a
     * permissão `tickets:manage` e que o chamado esteja ativo (Aberto ou Em Andamento).
     */
    removeAssignee(ticketId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, removingAssignee: true });

      store._ticketDataService.removeAssignee(ticketId).pipe(
        finalize(() => patchState(store, { removingAssignee: false }))
      ).subscribe({
        next: () => {
          store._detailResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para remover o responsável deste ticket.',
              404: 'Ticket não encontrado — ele pode ter sido removido.',
              409: 'Não foi possível remover o responsável — tente novamente.'
            }, 'Erro ao remover o responsável.')
          });
        }
      });
    },

    /**
     * Busca usuários ativos candidatos a responsável, pelo nome/sobrenome/e-mail (GET /users) — exige
     * a permissão `users:read`, que é diferente de `tickets:manage`; quem administra chamados mas não
     * usuários recebe aqui a mensagem de permissão, não um resultado vazio silencioso.
     */
    searchAssignees(search: string): void {
      const trimmed = search.trim();
      if (!trimmed) {
        patchState(store, { assigneeCandidates: [], searchingAssignees: false, assigneeSearchError: null });
        return;
      }

      patchState(store, { searchingAssignees: true, assigneeSearchError: null });

      store._userDataService.getAll({ status: 'Active', search: trimmed, page: 1, pageSize: 8 }).pipe(
        finalize(() => patchState(store, { searchingAssignees: false }))
      ).subscribe({
        next: (page) => patchState(store, { assigneeCandidates: page.items }),
        error: (err: HttpErrorResponse) => patchState(store, {
          assigneeCandidates: [],
          assigneeSearchError: extractErrorMessage(err, {
            403: 'Você não tem permissão para buscar usuários.'
          }, 'Erro ao buscar usuários.')
        })
      });
    },

    /** Limpa os resultados da busca de candidatos a responsável — ex.: ao abrir o modal de atribuição. */
    clearAssigneeSearch(): void {
      patchState(store, { assigneeCandidates: [], assigneeSearchError: null });
    },

    /**
     * Atribui (ou reatribui) o responsável do ticket e recarrega o detalhe em caso de sucesso —
     * exige a permissão `tickets:manage` de quem atribui e de quem é atribuído, e que o chamado
     * esteja ativo (Aberto ou Em Andamento).
     */
    assignTicket(ticketId: string, userId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, assigningTicket: true });

      store._ticketDataService.assignTicket(ticketId, userId).pipe(
        finalize(() => patchState(store, { assigningTicket: false }))
      ).subscribe({
        next: () => {
          store._detailResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          // O candidato existe e está ativo, mas não tem a permissão tickets:manage — a mensagem do
          // back-end já descreve o problema; só falta apontar a correção (escolher outro candidato).
          const candidateNotEligible = err.status === 400 && err.error?.title === 'Tickets.AssigneeCannotManageTickets';

          patchState(store, {
            mutationError: candidateNotEligible
              ? `${extractErrorMessage(err, {}, 'Esse usuário não pode ser responsável.')} Escolha outro usuário na lista.`
              : extractErrorMessage(err, {
                  403: 'Você não tem permissão para atribuir o responsável deste ticket.',
                  404: 'Ticket ou usuário não encontrado.',
                  409: 'Não foi possível atribuir o responsável — tente novamente.'
                }, 'Erro ao atribuir o responsável.')
          });
        }
      });
    }
  }))
);
