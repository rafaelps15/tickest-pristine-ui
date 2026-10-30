import { HttpErrorResponse } from '@angular/common/http';

/** Mensagens de fallback por status HTTP, sobrescrevíveis por chamada. */
export type HttpErrorStatusMessages = Record<number, string>;

/** Mensagens usadas quando a chamada não traz uma própria para o status. */
const DEFAULT_STATUS_MESSAGES: HttpErrorStatusMessages = {
  0: 'Não foi possível conectar ao servidor. Verifique sua conexão.'
};

/** Extrai uma mensagem amigável de um HttpErrorResponse, priorizando o corpo retornado pela API. */
export function extractErrorMessage(
  err: HttpErrorResponse,
  statusMessages: HttpErrorStatusMessages = {},
  fallback = 'Ocorreu um erro inesperado. Tente novamente.'
): string {
  // status 0 significa que não houve resposta HTTP (falha de rede/CORS): err.error aqui é o
  // próprio erro de rede (ex.: TypeError "Failed to fetch"), não um corpo de erro da API.
  // Corpo de erro real da API é um ProblemDetails: { title, detail, errors? }.
  if (err.status !== 0) {
    // Erros de validação vêm como uma lista de objetos { code, description, type }, não como o
    // dicionário Record<string, string[]> do formato padrão do ASP.NET.
    const validationErrors: { description: string }[] | undefined = err.error?.errors;
    const validationMessage = Array.isArray(validationErrors)
      ? validationErrors.map(e => e.description).join(' ')
      : undefined;
    const apiMessage: string | undefined = validationMessage || err.error?.detail || err.error?.title;
    if (apiMessage) return apiMessage;
  }

  return statusMessages[err.status] ?? DEFAULT_STATUS_MESSAGES[err.status] ?? fallback;
}

/**
 * Indica se a falha é passageira — sem resposta do servidor (status 0), limite de requisições (429)
 * ou erro do servidor (5xx) —, e não uma recusa da sessão ou da operação. Falha passageira não
 * pode encerrar a sessão.
 */
export function isTransientHttpError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status === 429 || error.status >= 500);
}
