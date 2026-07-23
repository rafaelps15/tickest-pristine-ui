import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PermissionRepository } from '../../domain/interfaces/permission.repository';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de permissões (GET /permissions). */
@Injectable({ providedIn: 'root' })
export class PermissionHttpRepository extends PermissionRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/permissions`;

    getAll() {
        return this.http
            .get<string[]>(this.apiUrl)
            .pipe(toResult());
    }
}
