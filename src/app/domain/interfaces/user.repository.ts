import { Observable } from "rxjs";
import { CreateUserData } from "../models/create-user-data.model";
import { Result } from "../models/result.model";
import { UserSummary } from "../models/user-summary.model";

/** Contrato do repositório de usuários. */
export abstract class UserRepository {
    abstract createUser(request: CreateUserData): Observable<Result<void>>;
    abstract getAll(): Observable<Result<UserSummary[]>>;
}
