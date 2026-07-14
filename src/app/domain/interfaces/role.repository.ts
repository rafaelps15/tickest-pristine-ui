import { Observable } from 'rxjs';
import { Role } from '../entities/role.entity';
import { Result } from '../models/result.model';

/** Contrato do repositório de papéis. */
export abstract class RoleRepository {
    abstract getAll(): Observable<Result<Role[]>>;
}
