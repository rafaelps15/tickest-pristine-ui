import { Observable } from "rxjs";
import { Result } from "../models/result.model";
import { UserSummary } from "../models/user-summary.model";

/** Contrato do repositório de usuários. */
export abstract class UserRepository {
    abstract getById(userId: string): Observable<Result<UserSummary>>;
}
