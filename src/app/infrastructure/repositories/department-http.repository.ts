import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { DepartmentRepository } from '../../domain/interfaces/department.repository';
import { Department, DepartmentData } from '../../domain/models/department.model';

import { DepartmentRequestDto } from '../dtos/department-request.dto';
import { DepartmentResponseDto } from '../dtos/department-response.dto';

import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de departamentos. */
@Injectable({
    providedIn: 'root'
})
export class DepartmentHttpRepository extends DepartmentRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/departments`;

    getAll() {
        return this.http
            .get<DepartmentResponseDto[]>(this.apiUrl)
            .pipe(toResult<Department[]>());
    }

    create(data: DepartmentData) {
        const dto: DepartmentRequestDto = data;
        return this.http
            .post<string>(this.apiUrl, dto)
            .pipe(toResult());
    }

    update(departmentId: string, data: DepartmentData) {
        const dto: DepartmentRequestDto = data;
        return this.http
            .put<void>(`${this.apiUrl}/${departmentId}`, dto)
            .pipe(toResult());
    }

    delete(departmentId: string) {
        return this.http
            .delete<void>(`${this.apiUrl}/${departmentId}`)
            .pipe(toResult());
    }
}
