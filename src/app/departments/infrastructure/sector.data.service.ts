import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSectorData, UpdateSectorData } from '../entities/sector';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos setores (criação, atualização e exclusão); a leitura vem aninhada em GET /departments. */
@Injectable({ providedIn: 'root' })
export class SectorDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sectors`;

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
