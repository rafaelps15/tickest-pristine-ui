/** Erro de domínio retornado por uma operação. */
export interface ResultError {
  message: string;
  code?: string;
}

/** Resultado de uma operação de repositório, independente de transporte. */
export interface Result<T> {
  value: T;
  isSuccess: boolean;
  isFailure: boolean;
  error: ResultError | null;
}
