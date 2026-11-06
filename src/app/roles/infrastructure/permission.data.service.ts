import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission } from '../entities/permission';
import { environment } from '../../../environments/environment';

/** Acesso HTTP ao catálogo de permissões disponíveis no sistema (nome, descrição e grupo; suporte à gestão de roles). */
@Injectable({ providedIn: 'root' })
export class PermissionDataService {
  /** Cliente HTTP do Angular. */
  private readonly http = inject(HttpClient);
  /** URL base do recurso na API (/permissions). */
  private readonly apiUrl = `${environment.apiUrl}/permissions`;

  /** Lista o catálogo completo de permissões disponíveis (GET /permissions). */
  getAll(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.apiUrl);
  }
}
