/** Status de usuário usado como filtro na listagem, conforme o enum UserStatusFilter do back-end. */
export type UserStatus = 'All' | 'Active' | 'Inactive';

/** Filtros e paginação aplicados à listagem de usuários (GET /users). */
export interface UserFilters {
  status: UserStatus;
  search?: string;
  /** Formato aaaa-mm-dd. */
  createdFrom?: string;
  /** Formato aaaa-mm-dd. */
  createdTo?: string;
  page: number;
  pageSize: number;
}
