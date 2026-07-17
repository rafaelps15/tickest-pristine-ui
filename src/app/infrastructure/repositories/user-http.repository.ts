import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { UserResponseDto } from '../dtos/user-response.dto';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de usuários. */
@Injectable({ providedIn: 'root' })
export class UserHttpRepository extends UserRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/users`;

    getById(userId: string) {
        return this.http
            .get<UserResponseDto>(`${this.apiUrl}/${userId}`)
            .pipe(toResult());
    }
}
