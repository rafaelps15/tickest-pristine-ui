import { Observable } from 'rxjs';
import { Result } from '../models/result.model';

/** Contrato do repositório de permissões (GET /permissions retorna os códigos disponíveis no sistema). */
export abstract class RoleRepository {
    abstract getAll(): Observable<Result<string[]>>;
}
