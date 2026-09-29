import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department, DepartmentData } from '../entities/department';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos departamentos (listagem, criação, atualização e exclusão). */
@Injectable({ providedIn: 'root' })
export class DepartmentDataService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/departments`;

    /** Lista todos os departamentos (GET /departments). */
    getAll(): Observable<Department[]> {
        return this.http.get<Department[]>(this.apiUrl);
    }

    /** Cria um novo departamento (POST /departments). */
    create(data: DepartmentData): Observable<string> {
        return this.http.post<string>(this.apiUrl, data);
    }

    /** Atualiza um departamento existente (PUT /departments/{departmentId}). */
    update(departmentId: string, data: DepartmentData): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${departmentId}`, data);
    }

    /** Exclui um departamento (DELETE /departments/{departmentId}). */
    delete(departmentId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${departmentId}`);
    }
}
