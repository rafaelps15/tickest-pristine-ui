import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSla } from '../entities/ticket-sla';
import { assigneeSearchErrorMessage, eligibleAssigneesResource } from './ticket-assignee-search';
import { updateWithFreshState } from './ticket-fresh-update';
import { ticketReadErrorMessage } from './ticket-read-error';
import { assignResponsibleErrorMessage } from './ticket-assign-error';
import { extractErrorMessage, valueOf } from '../../shared';

/**
 * Store do detalhe de um ticket, carregado pelo id (GET /tickets/{id}), e das mutações feitas a
 * partir dessa tela — atribuir/remover o responsável, inclusive a busca de candidatos elegíveis
 * para atribuição (GET /tickets/assignees — ver o método `searchAssignees`).
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
    slaError: null as string | null,
    /** Termo da busca de candidatos a responsável (vazio = sem busca). */
    assigneeSearchTerm: ''
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService)
  })),
  withProps((store) => ({
    _detailResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => store._ticketDataService.getById(params)
    }),
    /** Candidatos a responsável pelo termo: um termo novo cancela a busca anterior. */
    _assigneeSearchResource: eligibleAssigneesResource(store._ticketDataService, store.assigneeSearchTerm)
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
        error: resourceError ? ticketReadErrorMessage(resourceError, 'Erro ao carregar o chamado') : null
      };
    }),
    /** Candidatos a responsável da última busca (vazio sem busca, durante a busca ou na falha). */
    assigneeCandidates: computed(() => valueOf(store._assigneeSearchResource) ?? []),
    /** A busca de candidatos a responsável está em andamento. */
    searchingAssignees: computed(() => store._assigneeSearchResource.isLoading()),
    /** Falha da busca de candidatos a responsável, ou `null`. */
    assigneeSearchError: computed(() => {
      const error = store._assigneeSearchResource.error() as HttpErrorResponse | undefined;
      return error ? assigneeSearchErrorMessage(error) : null;
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

      patchState(store, { slaError: null });

      store._ticketDataService.getSla(ticketId).subscribe({
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
     * Busca candidatos a responsável pelo nome (GET /tickets/assignees): só quem a atribuição aceita
     * (ativo com `tickets:manage`, a mesma regra do back-end) e sem exigir `users:read`. Um termo novo
     * cancela a busca anterior; vazio não busca.
     */
    searchAssignees(search: string): void {
      patchState(store, { assigneeSearchTerm: search.trim() });
    },

    /** Limpa a busca de candidatos a responsável — ex.: ao abrir o modal de atribuição. */
    clearAssigneeSearch(): void {
      patchState(store, { assigneeSearchTerm: '' });
    },

    /**
     * Muda o status do ticket e recarrega o detalhe em caso de sucesso. Fechar vai pela rota própria
     * (POST /tickets/{id}/close), porque o PUT recusa o status Fechado; as demais transições vão pelo
     * PUT /tickets/{id}, que exige descrição + status juntos — a descrição vem do chamado relido logo
     * antes ({@link updateWithFreshState}), e não da tela. Exige a permissão `tickets:manage`.
     */
    updateStatus(ticketId: string, status: TicketStatus, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, updatingStatus: true, _slaOverride: null });

      const request = status === TicketStatus.Closed
        ? store._ticketDataService.close(ticketId)
        : updateWithFreshState(store._ticketDataService, ticketId, { status });

      request.pipe(
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
     * Atualiza a descrição do ticket mantendo o status (PUT /tickets/{id}, que exige os dois campos
     * juntos — o status vem do chamado relido logo antes, {@link updateWithFreshState}) e recarrega o
     * detalhe em caso de sucesso. Exige ser quem abriu o chamado (permissão `tickets:update-own`) ou ter
     * `tickets:manage`.
     */
    updateDescription(ticketId: string, description: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, updatingDescription: true });

      updateWithFreshState(store._ticketDataService, ticketId, { description }).pipe(
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

    /**
     * Reabre um ticket inativo (Resolvido/Fechado/Cancelado), com o motivo opcional (o back-end o grava
     * como mensagem de quem reabriu, na mesma transação), e recarrega o detalhe em caso de sucesso.
     */
    reopen(ticketId: string, reason: string | null, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, reopening: true, _slaOverride: null });

      store._ticketDataService.reopen(ticketId, reason).pipe(
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
          const candidateNotEligible = err.status === 400 && err.error?.title === 'Tickets.AssigneeNotAttendant';

          patchState(store, {
            mutationError: candidateNotEligible
              ? `${extractErrorMessage(err, {}, 'Esse usuário não pode ser responsável.')} Escolha outro usuário na lista.`
              : assignResponsibleErrorMessage(err, { 409: 'Não foi possível atribuir o responsável — tente novamente.' })
          });
        }
      });
    }
  }))
);
