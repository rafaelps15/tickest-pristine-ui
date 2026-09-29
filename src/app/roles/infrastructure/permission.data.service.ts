import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos códigos de permissão disponíveis no sistema (suporte à gestão de roles). */
@Injectable({ providedIn: 'root' })
export class PermissionDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/permissions`;

  /** Lista todos os códigos de permissão disponíveis (GET /permissions). */
  getAll(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }
}
