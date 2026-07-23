import { Observable } from "rxjs";
import { Result } from "../models/result.model";
import { UserSummary } from "../models/user-summary.model";

/** Contrato do repositório de usuários. */
export abstract class UserRepository {
    abstract getById(userId: string): Observable<Result<UserSummary>>;
    abstract getAll(): Observable<Result<UserSummary[]>>;
    abstract assignRoles(userId: string, roleIds: string[]): Observable<Result<void>>;
}
