import { Observable } from 'rxjs';
import { Role } from '../models/role.model';
import { Result } from '../models/result.model';

/** Contrato do repositório de roles (RBAC: Users -> Roles -> Permissions). */
export abstract class RoleRepository {
    abstract getAll(): Observable<Result<Role[]>>;
    abstract create(name: string): Observable<Result<string>>;
    abstract assignPermissions(roleId: string, permissionCodes: string[]): Observable<Result<void>>;
}
