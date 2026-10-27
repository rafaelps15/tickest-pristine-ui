import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TicketMonitorFilters } from '../entities/ticket-monitor-filters';
import { TicketStatus } from '../entities/ticket-status';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage } from '../../shared';
import { UserDataService, UserSummary } from '../../users';

/** Filtros e paginação padrão: todos os status/prioridade/SLA, mais recentes primeiro, 20 por página. */
const DEFAULT_FILTERS: TicketMonitorFilters = { sort: TicketSortOrder.Newest, page: 1, pageSize: 20 };

/**
 * Store de "Monitorar Tickets": listagem paginada e filtrável de todos os chamados do sistema,
 * mais o resumo de SLA dos chamados ativos — os dois somente leitura, para quem administra a
 * fila (`tickets:manage`). Duas ações rápidas de atribuição, direto na linha da tabela, sem ida à
 * tela de detalhe: "pra mim" (um clique) e "escolher responsável" (busca por nome/e-mail no modal
 * "Atribuir responsável"). O resumo de SLA acompanha o filtro de setor da listagem.
 */
export const TicketMonitorStore = signalStore(
  { providedIn: 'root' },
  withState({
    filters: DEFAULT_FILTERS,
    /** Ids de chamados com uma atribuição "pra mim" em andamento — desabilita só a linha, não a tabela inteira. */
    assigningToMeIds: [] as string[],
    /** Erro da última tentativa de atribuição (pra mim ou de um responsável escolhido), separado dos erros de leitura da listagem/resumo de SLA. */
    mutationError: null as string | null,
    /** Se a atribuição de um responsável escolhido no modal "Atribuir responsável" está em andamento. */
    assigningResponsible: false,
    /** Candidatos a responsável encontrados na busca do modal "Atribuir responsável". */
    responsibleCandidates: [] as UserSummary[],
    searchingResponsibleCandidates: false,
    responsibleSearchError: null as string | null
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService),
    _userDataService: inject(UserDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => store.filters(),
      stream: ({ params }) => store._ticketDataService.getAll(params)
    }),
    // Envelopado em objeto: `sectorId` indefinido é um valor válido (= todos os setores), não "ainda sem parâmetros" — um `params` que
    // retornasse `undefined` direto faria o rxResource pular a busca, em vez de buscar o resumo do sistema inteiro.
    _slaSummaryResource: rxResource({
      params: () => ({ sectorId: store.filters().sectorId }),
      stream: ({ params }) => store._ticketDataService.getSlaSummary(params.sectorId)
    })
  })),
  withComputed((store) => ({
    /** Página atual devolvida pela API (itens + dados de paginação). */
    ticketsPage: computed(() => store._listResource.value()),
    /** Tickets da página atual. */
    tickets: computed(() => store._listResource.value()?.items ?? []),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {
          403: 'Você não tem permissão para monitorar os chamados do sistema.'
        }, 'Erro ao carregar chamados') : null
      };
    }),
    /** Resumo de SLA dos chamados ativos, respeitando o filtro de setor atual. */
    slaSummary: computed(() => store._slaSummaryResource.value()),
    /** Estado agregado do resumo de SLA (carregamento e erro) — os 4 cards do topo mostram "—" sem nenhum aviso se isso não for tratado. */
    slaSummaryState: computed(() => {
      const resourceError = store._slaSummaryResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._slaSummaryResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {}, 'Erro ao carregar o resumo de SLA') : null
      };
    })
  })),
  withComputed((store) => ({
    /** Página atual (1-based). */
    currentPage: computed(() => store.ticketsPage()?.page ?? store.filters().page),
    /** Itens por página efetivamente aplicados pela API. */
    currentPageSize: computed(() => store.ticketsPage()?.pageSize ?? store.filters().pageSize),
    /** Total de tickets que batem com os filtros atuais (todas as páginas). */
    total: computed(() => store.ticketsPage()?.totalCount ?? 0),
    /** Total de páginas disponíveis com os filtros atuais. */
    totalPages: computed(() => store.ticketsPage()?.totalPages ?? 0),
    /** Indica se existe uma página anterior à atual. */
    hasPreviousPage: computed(() => store.ticketsPage()?.hasPreviousPage ?? false),
    /** Indica se existe uma página seguinte à atual. */
    hasNextPage: computed(() => store.ticketsPage()?.hasNextPage ?? false)
  })),
  withMethods((store) => ({
    /** Recarrega a página atual com os filtros atuais. */
    load(): void {
      store._listResource.reload();
    },

    /** Recarrega o resumo de SLA (ex.: botão "Tentar novamente" depois de uma falha). */
    reloadSlaSummary(): void {
      store._slaSummaryResource.reload();
    },

    /** Limpa o erro da última atribuição (ex.: ao trocar de filtro/página, pra não deixar um erro antigo preso na tela). */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    },

    /** Muda o filtro de status e volta para a primeira página. */
    setStatus(status: TicketStatus | undefined): void {
      patchState(store, { filters: { ...store.filters(), status, page: 1 } });
    },

    /** Muda o filtro de prioridade e volta para a primeira página. */
    setPriority(priority: TicketPriority | undefined): void {
      patchState(store, { filters: { ...store.filters(), priority, page: 1 } });
    },

    /** Muda o filtro de setor e volta para a primeira página (também refaz o resumo de SLA). */
    setSectorId(sectorId: string | undefined): void {
      patchState(store, { filters: { ...store.filters(), sectorId, page: 1 } });
    },

    /** Muda o filtro de situação do SLA e volta para a primeira página. */
    setSlaStatus(slaStatus: TicketSlaStatus | undefined): void {
      patchState(store, { filters: { ...store.filters(), slaStatus, page: 1 } });
    },

    /** Muda o termo de busca e volta para a primeira página. */
    setSearch(search: string): void {
      patchState(store, { filters: { ...store.filters(), search: search || undefined, page: 1 } });
    },

    /** Alterna o filtro "só sem responsável" e volta para a primeira página. */
    setUnassignedOnly(unassignedOnly: boolean): void {
      patchState(store, { filters: { ...store.filters(), unassignedOnly, page: 1 } });
    },

    /** Muda a ordenação e volta para a primeira página. */
    setSort(sort: TicketSortOrder): void {
      patchState(store, { filters: { ...store.filters(), sort, page: 1 } });
    },

    /** Navega para a página informada. */
    goToPage(page: number): void {
      patchState(store, { filters: { ...store.filters(), page } });
    },

    /** Muda a quantidade de itens por página e volta para a primeira página. */
    setPageSize(pageSize: number): void {
      patchState(store, { filters: { ...store.filters(), pageSize, page: 1 } });
    },

    /** Limpa todos os filtros, voltando ao estado padrão. */
    clearFilters(): void {
      patchState(store, { filters: DEFAULT_FILTERS });
    },

    /**
     * Substitui todos os filtros de uma vez, sem o efeito colateral de voltar pra página 1 que os
     * `set*` individuais têm — usado só pra restaurar o estado a partir da query string ao
     * inicializar a tela (recarregar/voltar/compartilhar o link precisa preservar a página exata).
     */
    hydrateFiltersFromUrl(filters: TicketMonitorFilters): void {
      patchState(store, { filters });
    },

    /**
     * Atribui o usuário logado como responsável do chamado, direto na linha da tabela — sem abrir
     * o modal de busca do detalhe do chamado. Resolve o backlog que o filtro "Só sem responsável"
     * identifica (achado do critique de 2026-10-24, P2): até aqui, atribuir um chamado sem
     * responsável exigia ida completa à tela de detalhe pra cada um.
     */
    assignToMe(ticketId: string, currentUserId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, assigningToMeIds: [...store.assigningToMeIds(), ticketId] });

      store._ticketDataService.assignTicket(ticketId, currentUserId).pipe(
        finalize(() => patchState(store, {
          assigningToMeIds: store.assigningToMeIds().filter(id => id !== ticketId)
        }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão pra ser responsável por este chamado.',
              404: 'Chamado não encontrado.',
              409: 'Não foi possível atribuir — o chamado pode já ter outro responsável ou ter mudado de status. Tente novamente.'
            }, 'Erro ao atribuir o chamado a você.')
          });
        }
      });
    },

    /**
     * Busca usuários ativos candidatos a responsável, pelo nome/sobrenome/e-mail (GET /users), pro
     * modal "Atribuir responsável" — mesmo padrão de busca já usado no detalhe do chamado
     * (`TicketDetailStore.searchAssignees`) e no seletor de responsável de Departamentos, cada tela
     * com sua própria cópia por ora (achado não-bloqueante de duplicação, registrado nos dois
     * critiques anteriores). Exige a permissão `users:read`, diferente de `tickets:manage`.
     */
    searchResponsibleCandidates(search: string): void {
      const trimmed = search.trim();
      if (!trimmed) {
        patchState(store, { responsibleCandidates: [], searchingResponsibleCandidates: false, responsibleSearchError: null });
        return;
      }

      patchState(store, { searchingResponsibleCandidates: true, responsibleSearchError: null });

      store._userDataService.getAll({ status: 'Active', search: trimmed, page: 1, pageSize: 8 }).pipe(
        finalize(() => patchState(store, { searchingResponsibleCandidates: false }))
      ).subscribe({
        next: (page) => patchState(store, { responsibleCandidates: page.items }),
        error: (err: HttpErrorResponse) => patchState(store, {
          responsibleCandidates: [],
          responsibleSearchError: extractErrorMessage(err, {
            403: 'Você não tem permissão para buscar usuários.'
          }, 'Erro ao buscar usuários.')
        })
      });
    },

    /** Limpa os resultados da busca de candidatos a responsável — ex.: ao abrir ou fechar o modal "Atribuir responsável". */
    clearResponsibleSearch(): void {
      patchState(store, { responsibleCandidates: [], responsibleSearchError: null });
    },

    /** Atribui o candidato escolhido no modal "Atribuir responsável" e recarrega a listagem em caso de sucesso. */
    assignResponsible(ticketId: string, userId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, assigningResponsible: true });

      store._ticketDataService.assignTicket(ticketId, userId).pipe(
        finalize(() => patchState(store, { assigningResponsible: false }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para atribuir o responsável deste chamado.',
              404: 'Chamado ou usuário não encontrado.',
              409: 'Não foi possível atribuir — o chamado pode já ter outro responsável ou ter mudado de status. Tente novamente.'
            }, 'Erro ao atribuir o responsável.')
          });
        }
      });
    }
  }))
);
