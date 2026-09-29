import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary } from '../entities/user-summary';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos usuários administrados (listagem, detalhe, atribuição de roles). */
@Injectable({ providedIn: 'root' })
export class UserDataService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/users`;

    /** Busca um usuário pelo id (GET /users/{id}). */
    getById(userId: string): Observable<UserSummary> {
        return this.http.get<UserSummary>(`${this.apiUrl}/${userId}`);
    }

    /** Lista todos os usuários (GET /users). */
    getAll(): Observable<UserSummary[]> {
        return this.http.get<UserSummary[]>(this.apiUrl);
    }

    /** Substitui os papéis (roles) de um usuário (PUT /users/{id}/roles). */
    assignRoles(userId: string, roleIds: string[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/roles`, { roleIds });
    }
}
