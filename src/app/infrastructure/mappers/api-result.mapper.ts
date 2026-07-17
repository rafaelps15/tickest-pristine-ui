import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiErrorDto } from '../dtos/api-error.dto';
import { Result } from '../../domain/models/result.model';

/**
 * Converte uma chamada HTTP crua em um Result de domínio.
 *
 * A API não envelopa respostas de sucesso (retorna o valor direto), e falhas chegam
 * como erro HTTP com corpo ProblemDetails — não há um formato "isSuccess/isFailure" no payload.
 */
export function toResult<T>() {
  return (source: Observable<T>): Observable<Result<T>> =>
    source.pipe(
      map((value): Result<T> => ({ value, isSuccess: true, isFailure: false, error: null })),
      catchError((err: HttpErrorResponse) => of(toFailureResult<T>(err)))
    );
}

function toFailureResult<T>(err: HttpErrorResponse): Result<T> {
  const problem = err.error as ApiErrorDto | undefined;

  const validationMessage = problem?.errors
    ? Object.values(problem.errors).flat().join(' ')
    : undefined;

  const message = validationMessage || problem?.detail || problem?.title || 'Ocorreu um erro inesperado.';

  return {
    value: undefined as T,
    isSuccess: false,
    isFailure: true,
    error: { message, code: problem?.title }
  };
}
