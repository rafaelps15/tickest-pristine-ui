import { HttpErrorResponse } from '@angular/common/http';

/** Mensagens de fallback por status HTTP, sobrescrevíveis por chamada. */
export type HttpErrorStatusMessages = Record<number, string>;

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
  if (err.status !== 0) {
    const apiMessage: string | undefined = err.error?.errorResult?.message || err.error?.message;
    if (apiMessage) return apiMessage;
  }

  return statusMessages[err.status] ?? DEFAULT_STATUS_MESSAGES[err.status] ?? fallback;
}
