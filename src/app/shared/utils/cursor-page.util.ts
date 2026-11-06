import { HttpParams } from '@angular/common/http';
import { PageCursor } from '../entities/cursor-page';

/**
 * Parâmetros de uma listagem por cursor ({@link PageCursor}): sem cursor, a primeira página; com o da página
 * anterior, a seguinte. O tamanho da página só vai quando dado (senão vale o padrão do back-end).
 */
export function cursorPageParams(cursor?: PageCursor, pageSize?: number): HttpParams {
  let params = new HttpParams();

  if (cursor) {
    params = params
      .set('cursorDate', cursor.cursorDate)
      .set('cursorId', cursor.cursorId);
  }
  if (pageSize) {
    params = params.set('pageSize', pageSize);
  }

  return params;
}
