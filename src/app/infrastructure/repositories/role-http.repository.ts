import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { RoleRepository } from '../../domain/interfaces/role.repository';
import { Role } from '../../domain/entities/role.entity';
import { ApiResultDto } from '../dtos/api-result.dto';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de papéis. */
@Injectable({ providedIn: 'root' })
export class RoleHttpRepository extends RoleRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/roles`;

    getAll() {
        return this.http
            .get<ApiResultDto<Role[]>>(this.apiUrl)
            .pipe(map(toResult));
    }
}
