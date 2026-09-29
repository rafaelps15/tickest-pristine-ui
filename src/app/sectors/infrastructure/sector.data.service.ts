import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSectorData, Sector, UpdateSectorData } from '../entities/sector';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos setores (listagem, criação, atualização e exclusão). */
@Injectable({ providedIn: 'root' })
export class SectorDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sectors`;

  /** Lista todos os setores (GET /sectors). */
  getAll(): Observable<Sector[]> {
    return this.http.get<Sector[]>(this.apiUrl);
  }

  /** Cria um novo setor (POST /sectors). */
  create(data: CreateSectorData): Observable<string> {
    return this.http.post<string>(this.apiUrl, data);
  }

  /** Atualiza um setor existente (PUT /sectors/{sectorId}). */
  update(sectorId: string, data: UpdateSectorData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${sectorId}`, data);
  }

  /** Exclui um setor (DELETE /sectors/{sectorId}). */
  delete(sectorId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sectorId}`);
  }
}
