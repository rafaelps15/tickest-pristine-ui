import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
    assignRoles(userId: string, roleNames: string[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/roles`, { roleNames });
    }

    /** Desativa um usuário, bloqueando seu login (PUT /users/{id}/deactivate). */
    deactivate(userId: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/deactivate`, {});
    }

    /**
     * Quantos chamados ainda em aberto (Aberto ou Em Andamento) estão atribuídos ao usuário — lido
     * do `totalCount` de GET /tickets com `pageSize=1`, sem trazer a lista. Fica aqui, e não no
     * domínio de chamados, porque `tickets` já importa `users`: o caminho inverso fecharia um ciclo
     * entre os barrels. Os status são os números do enum TicketStatus do back-end (1 = Aberto,
     * 2 = Em Andamento), os mesmos de `TICKET_ACTIVE_STATUSES`.
     */
    countOpenAssignedTickets(userId: string): Observable<number> {
        const params = new HttpParams()
            .set('assignedToUserId', userId)
            .append('status', 1)
            .append('status', 2)
            .set('page', 1)
            .set('pageSize', 1);
        return this.http.get<PagedResponse<unknown>>(`${environment.apiUrl}/tickets`, { params })
            .pipe(map(page => page.totalCount));
    }

    /** Reemite o convite de ativação de quem ainda não ativou a conta, revogando o anterior e enviando novo e-mail (POST /users/{id}/invitation). */
    resendInvitation(userId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${userId}/invitation`, {});
    }

    /** Reativa um usuário, liberando o acesso de novo (PUT /users/{id}/activate). */
    activate(userId: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${userId}/activate`, {});
    }
}
