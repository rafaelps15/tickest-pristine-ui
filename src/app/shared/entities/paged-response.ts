/** Uma página de uma listagem paginada por offset, conforme devolvido pelo back-end (PagedResponse&lt;T&gt;). */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
