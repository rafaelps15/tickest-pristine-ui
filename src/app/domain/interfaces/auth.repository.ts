import { Observable } from 'rxjs';
import { LoginCredentials } from '../models/login-credentials.model';
import { CreateUserData } from '../models/create-user-data.model';
import { Result } from '../models/result.model';

/** Contrato do repositório de autenticação. */
export abstract class AuthRepository {
    abstract login(request: LoginCredentials): Observable<Result<string>>;
    abstract register(request: CreateUserData): Observable<Result<void>>;
}

