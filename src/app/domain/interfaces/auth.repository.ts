import { Observable } from 'rxjs';
import { LoginCredentials } from '../models/login-credentials.model';
import { CreateUserData } from '../models/create-user-data.model';
import { AccessTokens } from '../models/access-tokens.model';
import { Result } from '../models/result.model';

/** Contrato do repositório de autenticação. */
export abstract class AuthRepository {
    abstract login(request: LoginCredentials): Observable<Result<AccessTokens>>;
    abstract register(request: CreateUserData): Observable<Result<string>>;
    abstract refresh(refreshToken: string): Observable<Result<AccessTokens>>;
}
