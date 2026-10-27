import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSla } from '../entities/ticket-sla';
import { UserDataService, UserSummary } from '../../users';
import { extractErrorMessage, valueOf } from '../../shared';

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
    updatingStatus: false,
    updatingDescription: false,
    reopening: false,
    /**
     * Bloco de SLA mais recente buscado via `refreshSla()` (GET /tickets/{id}/sla), sem recarregar
     * o chamado inteiro — sobrepõe o `sla` que já vem no detalhe até o próximo carregamento
     * completo (`loadTicket`/`updateStatus`/`reopen`), que já traz um `sla` fresco embutido e limpa
     * este override pra não mostrar um SLA desatualizado por engano.
     */
    _slaOverride: null as TicketSla | null,
    slaRefreshing: false,
    slaError: null as string | null,
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
    ticket: computed(() => valueOf(store._detailResource)),
    /** Bloco de SLA vigente: o mais recente buscado por `refreshSla()`, ou o que já vem no detalhe. */
    sla: computed(() => store._slaOverride() ?? valueOf(store._detailResource)?.sla ?? null),
    /** Estado do carregamento do detalhe: carregando e erro (com mensagens próprias para 404 e 403). */
    state: computed(() => {
      const resourceError = store._detailResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._detailResource.isLoading(),
        error: resourceError
          ? extractErrorMessage(resourceError, {
              403: 'Você não tem acesso a este chamado.',
              404: 'Não encontramos esse chamado — ele pode ter sido removido.'
            }, 'Erro ao carregar o chamado')
          : null
      };
    })
  })),
  withMethods((store) => ({
    /** Define o ticket a exibir, disparando o carregamento do detalhe — o SLA vem embutido nele. */
    loadTicket(ticketId: string): void {
      patchState(store, { _slaOverride: null });

      if (store.ticketId() === ticketId) {
        store._detailResource.reload();
        return;
      }
      patchState(store, { ticketId });
    },

    /**
     * Busca só o bloco de SLA do ticket atual (GET /tickets/{id}/sla), sem recarregar o chamado
     * inteiro — pra quando outra tela/Store (ex.: publicação de mensagem) conclui a primeira
     * resposta e precisa só atualizar o painel de SLA.
     */
    refreshSla(): void {
      const ticketId = store.ticketId();
      if (!ticketId) return;

      patchState(store, { slaRefreshing: true, slaError: null });

      store._ticketDataService.getSla(ticketId).pipe(
        finalize(() => patchState(store, { slaRefreshing: false }))
      ).subscribe({
        next: (sla) => patchState(store, { _slaOverride: sla }),
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            slaError: extractErrorMessage(err, {
              404: 'Chamado não encontrado — ele pode ter sido removido.'
            }, 'Erro ao atualizar o SLA.')
          });
        }
      });
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
              403: 'Você não tem permissão para remover o responsável deste chamado.',
              404: 'Chamado não encontrado — ele pode ter sido removido.',
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
     * Muda o status do ticket (PUT /tickets/{id}, que exige descrição + status juntos — por isso
     * recebe a descrição atual, sem oferecer edição aqui) e recarrega o detalhe em caso de
     * sucesso. Exige a permissão `tickets:manage`.
     */
    updateStatus(ticketId: string, status: TicketStatus, currentDescription: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, updatingStatus: true, _slaOverride: null });

      store._ticketDataService.update(ticketId, { description: currentDescription, status }).pipe(
        finalize(() => patchState(store, { updatingStatus: false }))
      ).subscribe({
        next: () => {
          store._detailResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para mudar o status deste chamado.',
              404: 'Chamado não encontrado — ele pode ter sido removido.',
              409: 'Não foi possível mudar o status — tente novamente.'
            }, 'Erro ao mudar o status do chamado.')
          });
        }
      });
    },

    /**
     * Atualiza a descrição do ticket mantendo o status atual (PUT /tickets/{id}, que exige os
     * dois campos juntos) e recarrega o detalhe em caso de sucesso. Exige ser quem abriu o chamado
     * (permissão `tickets:update-own`) ou ter `tickets:manage`.
     */
    updateDescription(ticketId: string, description: string, currentStatus: TicketStatus, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, updatingDescription: true });

      store._ticketDataService.update(ticketId, { description, status: currentStatus }).pipe(
        finalize(() => patchState(store, { updatingDescription: false }))
      ).subscribe({
        next: () => {
          store._detailResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para editar este chamado.',
              404: 'Chamado não encontrado — ele pode ter sido removido.',
              409: 'Não foi possível salvar a edição — tente novamente.'
            }, 'Erro ao editar o chamado.')
          });
        }
      });
    },

    /** Reabre um ticket inativo (Resolvido/Fechado/Cancelado) e recarrega o detalhe em caso de sucesso. */
    reopen(ticketId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, reopening: true, _slaOverride: null });

      store._ticketDataService.reopen(ticketId).pipe(
        finalize(() => patchState(store, { reopening: false }))
      ).subscribe({
        next: () => {
          store._detailResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para reabrir este chamado.',
              404: 'Chamado não encontrado — ele pode ter sido removido.',
              409: 'Não foi possível reabrir o chamado — tente novamente.'
            }, 'Erro ao reabrir o chamado.')
          });
        }
      });
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
                  403: 'Você não tem permissão para atribuir o responsável deste chamado.',
                  404: 'Chamado ou usuário não encontrado.',
                  409: 'Não foi possível atribuir o responsável — tente novamente.'
                }, 'Erro ao atribuir o responsável.')
          });
        }
      });
    }
  }))
);
