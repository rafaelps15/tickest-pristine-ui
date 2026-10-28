import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { TicketMonitorFilters } from '../entities/ticket-monitor-filters';
import { TicketStatus } from '../entities/ticket-status';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketStatsQuery } from '../entities/ticket-stats-query';
import { TicketSlaSummary } from '../entities/ticket-sla-summary';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage, valueOf } from '../../shared';
import { UserDataService, UserSummary } from '../../users';

/**
 * Filtros e paginação padrão: a fila de trabalho — só os ativos (Aberto + Em andamento), o prazo
 * que vence primeiro no topo, 20 por página. "Todos os status" fica a um clique.
 */
export const TICKET_MONITOR_DEFAULT_FILTERS: TicketMonitorFilters = { activeOnly: true, sort: TicketSortOrder.DueDate, page: 1, pageSize: 20 };

/**
 * Store de "Monitorar Tickets": listagem paginada e filtrável de todos os chamados do sistema,
 * mais o resumo de SLA dos chamados ativos — os dois somente leitura, para quem administra a
 * fila (`tickets:manage`). Duas ações rápidas de atribuição, direto na linha da tabela, sem ida à
 * tela de detalhe: "pra mim" (um clique) e "escolher responsável" (busca por nome/e-mail no modal
 * "Atribuir responsável"). O resumo de SLA acompanha o recorte da listagem que o agregado aceita.
 */
export const TicketMonitorStore = signalStore(
  { providedIn: 'root' },
  withState({
    filters: TICKET_MONITOR_DEFAULT_FILTERS,
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
  withProps((store) => {
    /**
     * Recorte do agregado a partir dos filtros da tabela, comparado pelo conteúdo: mudar a busca, o
     * Status, o SLA ou o Aguardando gera filtros novos, mas o mesmo recorte — sem refazer os números.
     */
    const overviewQuery = computed((): TicketStatsQuery => {
      const f = store.filters();
      return {
        sectorIds: f.sectorIds, priority: f.priority, unassignedOnly: f.unassignedOnly,
        assignedToUserId: f.assignedToUserId, createdFrom: f.createdFrom, createdTo: f.createdTo
      };
    }, { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) });

    return {
      _listResource: rxResource({
        params: () => store.filters(),
        stream: ({ params }) => store._ticketDataService.getAll(params)
      }),
      // Os números do topo vêm do agregado da operação (GET /tickets/stats/overview, spec 026) com o
      // recorte da tabela que ele aceita: setores (vários), prioridade, responsável e período de abertura.
      // Busca, Status, SLA e Aguardando ficam de fora — a tela diz isso acima dos cards. Um objeto
      // sempre (nunca `undefined`), pra o resource buscar também sem nenhum filtro.
      _slaSummaryResource: rxResource({
        params: overviewQuery,
        // A hora da chegada junto da hora do servidor: o prazo relativo da tabela anda no relógio do servidor.
        stream: ({ params }) => store._ticketDataService.getOverview(params).pipe(map((overview): TicketSlaSummary & { receivedAtMs: number } => ({
          activeCount: overview.volume.backlogCount,
          onTimeCount: overview.sla.onTimeCount,
          atRiskCount: overview.sla.atRiskCount,
          breachedCount: overview.sla.breachedCount,
          serverNowUtc: overview.serverNowUtc,
          receivedAtMs: Date.now()
        })))
      })
    };
  }),
  withComputed((store) => ({
    /** Página atual devolvida pela API (itens + dados de paginação). */
    ticketsPage: computed(() => valueOf(store._listResource)),
    /** Tickets da página atual. */
    tickets: computed(() => valueOf(store._listResource)?.items ?? []),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {
          403: 'Você não tem permissão para monitorar os chamados do sistema.'
        }, 'Erro ao carregar chamados') : null
      };
    }),
    /**
     * Quanto o relógio do servidor está à frente (+) ou atrás (−) do navegador, em ms, pela hora que
     * veio no resumo de SLA — 0 enquanto ele não chega. "Vence em"/"venceu há" usa a hora do servidor.
     */
    clockOffsetMs: computed(() => {
      const summary = valueOf(store._slaSummaryResource);
      return summary ? Date.parse(summary.serverNowUtc) - summary.receivedAtMs : 0;
    }),
    /** Resumo de SLA dos chamados ativos, respeitando o filtro de setor atual. */
    slaSummary: computed(() => valueOf(store._slaSummaryResource)),
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

    /**
     * Muda o filtro de status e volta para a primeira página. `'active'` é o grupo "Ativos" (Aberto
     * e Em Andamento juntos); um status específico ou "Todos" desliga esse grupo.
     */
    setStatus(status: TicketStatus | 'active' | undefined): void {
      const activeOnly = status === 'active' ? true : undefined;
      patchState(store, { filters: { ...store.filters(), status: status === 'active' ? undefined : status, activeOnly, page: 1 } });
    },

    /** Muda o filtro de prioridade e volta para a primeira página. */
    setPriority(priority: TicketPriority | undefined): void {
      patchState(store, { filters: { ...store.filters(), priority, page: 1 } });
    },

    /** Muda o filtro de setores e volta para a primeira página; vazio = todos. */
    setSectorIds(sectorIds: string[] | undefined): void {
      patchState(store, { filters: { ...store.filters(), sectorIds: sectorIds?.length ? sectorIds : undefined, page: 1 } });
    },

    /** Muda o período de abertura (`aaaa-mm-dd`, inclusivo) e volta para a primeira página. */
    setCreatedRange(createdFrom: string | undefined, createdTo: string | undefined): void {
      patchState(store, { filters: { ...store.filters(), createdFrom, createdTo, page: 1 } });
    },

    /** Muda o filtro "aguardando" (de quem o chamado espera ação) e volta para a primeira página. */
    setAwaiting(awaiting: TicketAwaiting | undefined): void {
      patchState(store, { filters: { ...store.filters(), awaiting, page: 1 } });
    },

    /** Muda o filtro de situação do SLA e volta para a primeira página. */
    setSlaStatus(slaStatus: TicketSlaStatus | undefined): void {
      patchState(store, { filters: { ...store.filters(), slaStatus, page: 1 } });
    },

    /** Muda o termo de busca e volta para a primeira página. */
    setSearch(search: string): void {
      patchState(store, { filters: { ...store.filters(), search: search || undefined, page: 1 } });
    },

    /** Alterna o filtro "só sem responsável" e volta para a primeira página (desliga "atribuídos a"). */
    setUnassignedOnly(unassignedOnly: boolean): void {
      const assignedToUserId = unassignedOnly ? undefined : store.filters().assignedToUserId;
      patchState(store, { filters: { ...store.filters(), unassignedOnly, assignedToUserId, page: 1 } });
    },

    /**
     * Filtra pelos chamados atribuídos a um usuário (a fila "Atribuídos a mim" passa o id de quem
     * está logado) e volta para a primeira página; `undefined` tira o filtro. Desliga "só sem
     * responsável", que é o oposto.
     */
    setAssignedToUserId(assignedToUserId: string | undefined): void {
      const unassignedOnly = assignedToUserId ? undefined : store.filters().unassignedOnly;
      patchState(store, { filters: { ...store.filters(), assignedToUserId, unassignedOnly, page: 1 } });
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
      patchState(store, { filters: TICKET_MONITOR_DEFAULT_FILTERS });
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
