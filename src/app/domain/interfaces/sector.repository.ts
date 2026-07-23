import { Observable } from 'rxjs';
import { CreateSectorData, Sector, UpdateSectorData } from '../models/sector.model';
import { Result } from '../models/result.model';

/** Contrato do repositório de setores. */
export abstract class SectorRepository {
    abstract getAll(): Observable<Result<Sector[]>>;
    abstract create(data: CreateSectorData): Observable<Result<string>>;
    abstract update(sectorId: string, data: UpdateSectorData): Observable<Result<void>>;
    abstract delete(sectorId: string): Observable<Result<void>>;
}
