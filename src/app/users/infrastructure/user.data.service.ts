import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary } from '../entities/user-summary';
import { UserFilters } from '../entities/user-filters';
import { ChangePasswordRequest, UpdateProfileRequest, UserProfile } from '../entities/user-profile';
import { PagedResponse } from '../../shared';
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

    /** Lista os usuários de forma paginada e filtrada (GET /users). */
    getAll(filters: UserFilters): Observable<PagedResponse<UserSummary>> {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('pageSize', filters.pageSize);

        if (filters.status !== 'All') {
            params = params.set('status', filters.status);
        }
        if (filters.search) {
            params = params.set('search', filters.search);
        }
        if (filters.createdFrom) {
            params = params.set('createdFrom', filters.createdFrom);
        }
        if (filters.createdTo) {
            params = params.set('createdTo', filters.createdTo);
        }

        return this.http.get<PagedResponse<UserSummary>>(this.apiUrl, { params });
    }

    /** Substitui os papéis (roles) de um usuário (PUT /users/{id}/roles). */
    assignRoles(userId: string, roleIds: string[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/roles`, { roleIds });
    }

    /** Desativa um usuário, bloqueando seu login (PUT /users/{id}/deactivate). */
    deactivate(userId: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/deactivate`, {});
    }

    /** Reativa um usuário, liberando o login dele de novo (PUT /users/{id}/activate). */
    activate(userId: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/activate`, {});
    }
}
