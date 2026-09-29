import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../entities/role';
import { environment } from '../../../environments/environment';

/** Acesso HTTP às roles (RBAC: Users -> Roles -> Permissions). */
@Injectable({ providedIn: 'root' })
export class RoleDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  /** Lista todas as roles (GET /roles). */
  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  /** Cria uma nova role (POST /roles). */
  create(name: string): Observable<string> {
    return this.http.post<string>(this.apiUrl, { name });
  }

  /** Substitui as permissões associadas a uma role (PUT /roles/{id}/permissions). */
  assignPermissions(roleId: string, permissionCodes: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${roleId}/permissions`, { permissionCodes });
  }
}
