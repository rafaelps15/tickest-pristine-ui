/**
 * Uma página de uma listagem paginada por cursor composto (data + id), conforme devolvido pelo back-end.
 * Para pedir a próxima página, envie {@link nextCursorDate} e {@link nextCursorId} como cursorDate e cursorId.
 */
export interface CursorPage<T> {
  /** Itens da página, do mais novo para o mais antigo. */
  items: T[];
  /** Data do último item da página, usada como cursor da próxima (nula quando a página veio vazia). */
  nextCursorDate: string | null;
  /** Id do último item da página, desempate do cursor quando duas datas são iguais. */
  nextCursorId: string | null;
  /** Indica se existe uma próxima página. */
  hasNextPage: boolean;
}

/** Cursor para pedir a próxima página de uma listagem por cursor. */
export interface PageCursor {
  /** Data do último item já carregado. */
  cursorDate: string;
  /** Id do último item já carregado. */
  cursorId: string;
}
