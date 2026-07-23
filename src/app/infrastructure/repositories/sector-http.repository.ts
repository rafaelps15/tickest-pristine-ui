import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { SectorRepository } from '../../domain/interfaces/sector.repository';
import { CreateSectorData, Sector, UpdateSectorData } from '../../domain/models/sector.model';

import { CreateSectorRequestDto } from '../dtos/create-sector-request.dto';
import { UpdateSectorRequestDto } from '../dtos/update-sector-request.dto';
import { SectorResponseDto } from '../dtos/sector-response.dto';

import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de setores. */
@Injectable({
    providedIn: 'root'
})
export class SectorHttpRepository extends SectorRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/sectors`;

    getAll() {
        return this.http
            .get<SectorResponseDto[]>(this.apiUrl)
            .pipe(toResult<Sector[]>());
    }

    create(data: CreateSectorData) {
        const dto: CreateSectorRequestDto = data;
        return this.http
            .post<string>(this.apiUrl, dto)
            .pipe(toResult());
    }

    update(sectorId: string, data: UpdateSectorData) {
        const dto: UpdateSectorRequestDto = data;
        return this.http
            .put<void>(`${this.apiUrl}/${sectorId}`, dto)
            .pipe(toResult());
    }

    delete(sectorId: string) {
        return this.http
            .delete<void>(`${this.apiUrl}/${sectorId}`)
            .pipe(toResult());
    }
}
