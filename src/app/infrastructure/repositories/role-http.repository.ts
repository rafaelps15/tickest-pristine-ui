import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { RoleRepository } from '../../domain/interfaces/role.repository';
import { Role } from '../../domain/models/role.model';
import { RoleResponseDto } from '../dtos/role-response.dto';

import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de roles. */
@Injectable({ providedIn: 'root' })
export class RoleHttpRepository extends RoleRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/roles`;

    getAll() {
        return this.http
            .get<RoleResponseDto[]>(this.apiUrl)
            .pipe(toResult<Role[]>());
    }

    create(name: string) {
        return this.http
            .post<string>(this.apiUrl, { name })
            .pipe(toResult());
    }

    assignPermissions(roleId: string, permissionCodes: string[]) {
        return this.http
            .put<void>(`${this.apiUrl}/${roleId}/permissions`, { permissionCodes })
            .pipe(toResult());
    }
}
