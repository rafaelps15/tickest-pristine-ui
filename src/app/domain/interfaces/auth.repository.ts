import { Observable } from 'rxjs';
import { LoginRequestDto } from '../../infrastructure/dtos/login-request.dto';
import { CreateUserRequestDto } from '../../infrastructure/dtos/create-user-request.dto';
import { ApiResultDto } from '../../infrastructure/dtos/api-result.dto';

/** Contrato do repositório de autenticação. */
export abstract class AuthRepository {
    abstract login(request: LoginRequestDto): Observable<ApiResultDto<string>>;
    abstract register(request: CreateUserRequestDto): Observable<ApiResultDto<void>>;
}

