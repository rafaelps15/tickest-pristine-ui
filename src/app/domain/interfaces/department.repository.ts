import { Observable } from 'rxjs';
import { Department, DepartmentData } from '../models/department.model';
import { Result } from '../models/result.model';

/** Contrato do repositório de departamentos. */
export abstract class DepartmentRepository {
    abstract getAll(): Observable<Result<Department[]>>;
    abstract create(data: DepartmentData): Observable<Result<string>>;
    abstract update(departmentId: string, data: DepartmentData): Observable<Result<void>>;
    abstract delete(departmentId: string): Observable<Result<void>>;
}
