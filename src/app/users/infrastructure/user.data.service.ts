import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary } from '../entities/user-summary';
import { ChangePasswordRequest, UpdateProfileRequest, UserProfile } from '../entities/user-profile';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos usuários (listagem, detalhe, edição de perfil, atribuição de roles). */
@Injectable({ providedIn: 'root' })
export class UserDataService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/users`;

    /** Busca o perfil de um usuário pelo id (GET /users/{id}). */
    getById(userId: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
    }

    /** Atualiza nome e sobrenome de um usuário (PUT /users/{id}/profile). */
    updateProfile(userId: string, request: UpdateProfileRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/profile`, request);
    }

    /** Altera a senha do usuário logado (PUT /users/me/password); revoga as demais sessões no back-end. */
    changePassword(request: ChangePasswordRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/me/password`, request);
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
