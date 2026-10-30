import { HttpErrorResponse } from '@angular/common/http';
import { Router, UrlTree } from '@angular/router';
import { SessionUnavailableReason } from '../entities/current-user';
import { isTransientHttpError } from './http-error.util';

/** Caminho da tela que aparece quando a sessão existe mas o usuário logado não pôde ser carregado (A-42). */
export const SESSION_UNAVAILABLE_PATH = '/sessao-indisponivel';

/** Motivos aceitos na URL da tela; qualquer outro valor vira `server-error`. */
const REASONS: readonly SessionUnavailableReason[] = ['rate-limited', 'offline', 'server-error'];

/** Monta a URL da tela de sessão indisponível com o motivo e a rota para onde voltar depois. */
export function sessionUnavailableUrlTree(router: Router, reason: SessionUnavailableReason, returnUrl: string): UrlTree {
  return router.createUrlTree([SESSION_UNAVAILABLE_PATH], { queryParams: { motivo: reason, retorno: returnUrl } });
}

/** Classifica uma falha passageira (ver {@link isTransientHttpError}) pelo motivo que a tela mostra; `null` se não for passageira. */
export function transientFailureReason(error: unknown): SessionUnavailableReason | null {
  if (!isTransientHttpError(error)) return null;
  const status = (error as HttpErrorResponse).status;
  return status === 0 ? 'offline' : status === 429 ? 'rate-limited' : 'server-error';
}

/** Lê o motivo da URL; desconhecido ou ausente vira `server-error`. */
export function parseSessionUnavailableReason(value: string | null): SessionUnavailableReason {
  return REASONS.find(reason => reason === value) ?? 'server-error';
}

/**
 * Rota de volta lida da URL, só se for um caminho interno (começa com uma `/` e não com `//`): sem
 * isso, o parâmetro serviria para mandar a pessoa a outro site. Inválida ou ausente vira o Início.
 */
export function safeReturnUrl(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(SESSION_UNAVAILABLE_PATH)
    ? value
    : '/dashboard';
}
