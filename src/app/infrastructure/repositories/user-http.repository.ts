import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { CreateUserData } from '../../domain/models/create-user-data.model';
import { CreateUserRequestDto } from '../dtos/create-user-request.dto';
import { ApiResultDto } from '../dtos/api-result.dto';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

import { UserSummary } from '../../domain/models/user-summary.model';

/** Implementação HTTP do repositório de usuários. */
@Injectable({ providedIn: 'root' })
export class UserHttpRepository extends UserRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/users`;

    createUser(request: CreateUserData) {
        const dto: CreateUserRequestDto = request;
        return this.http
            .post<ApiResultDto<void>>(this.apiUrl, dto)
            .pipe(map(toResult));
    }

    getAll() {
        return this.http
            .get<ApiResultDto<UserSummary[]>>(this.apiUrl)
            .pipe(map(toResult));
    }
}
