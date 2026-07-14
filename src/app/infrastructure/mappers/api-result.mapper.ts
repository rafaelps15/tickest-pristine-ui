import { ApiResultDto } from '../dtos/api-result.dto';
import { Result } from '../../domain/models/result.model';

/** Converte a resposta HTTP padronizada da API em um Result de domínio. */
export function toResult<T>(dto: ApiResultDto<T>): Result<T> {
  return {
    value: dto.value,
    isSuccess: dto.isSuccess,
    isFailure: dto.isFailure,
    error: dto.errorResult ? { message: dto.errorResult.message, code: dto.errorResult.code } : null
  };
}
