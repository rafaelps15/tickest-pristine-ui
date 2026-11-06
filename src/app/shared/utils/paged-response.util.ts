import { computed } from '@angular/core';
import { PagedResponse } from '../entities/paged-response';

/**
 * Sinais de paginação de uma listagem por offset ({@link PagedResponse}), a partir da página que a API devolveu
 * (`undefined` enquanto carrega ou em erro): até ela chegar, a página e o tamanho são os pedidos. Usados pelas
 * Stores de Meus Chamados, do Monitor e de Usuários, dentro do `withComputed`.
 */
export function pagedResponseSignals(
  page: () => PagedResponse<unknown> | undefined,
  requestedPage: () => number,
  requestedPageSize: () => number
) {
  return {
    /** Página atual (1-based). */
    currentPage: computed(() => page()?.page ?? requestedPage()),
    /** Itens por página efetivamente aplicados pela API. */
    currentPageSize: computed(() => page()?.pageSize ?? requestedPageSize()),
    /** Total de itens que batem com os filtros atuais (todas as páginas). */
    total: computed(() => page()?.totalCount ?? 0),
    /** Total de páginas disponíveis com os filtros atuais. */
    totalPages: computed(() => page()?.totalPages ?? 0),
    /** Indica se existe uma página anterior à atual. */
    hasPreviousPage: computed(() => page()?.hasPreviousPage ?? false),
    /** Indica se existe uma página seguinte à atual. */
    hasNextPage: computed(() => page()?.hasNextPage ?? false)
  };
}
