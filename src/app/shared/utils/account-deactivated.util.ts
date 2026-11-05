import { HttpErrorResponse } from '@angular/common/http';

/** Código da recusa que o back-end devolve (403) quando a conta do usuário logado foi desativada. */
export const ACCOUNT_DEACTIVATED_CODE = 'Users.Deactivated';

/** Valor do parâmetro `motivo` do login quando a sessão acabou porque a conta foi desativada. */
export const ACCOUNT_DEACTIVATED_LOGIN_REASON = 'conta-desativada';

/**
 * Indica se o erro é a recusa da conta desativada (403 `Users.Deactivated`). Lê o `code` do Problem Details e, enquanto o
 * back-end só manda o código no `title` dessa recusa, o `title`.
 */
export function isAccountDeactivated(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 403) return false;

  const body = error.error as { code?: string; title?: string } | null;
  return (body?.code ?? body?.title) === ACCOUNT_DEACTIVATED_CODE;
}
